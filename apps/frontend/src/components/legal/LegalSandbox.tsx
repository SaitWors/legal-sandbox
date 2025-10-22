"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eraser,
  Eye,
  FileText,
  GitMerge,
  Link2,
  ListChecks,
  Rows,
  Scale,
  Search,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";

/**
 * Песочница для юридических правок (Frontend MVP)
 * — Вставка/загрузка текста договора
 * — Сегментация на пункты
 * — Поиск дублей (Jaccard-похожесть)
 * — Поиск конфликтов (наивные языковые правила RU: разрешено/запрещено, должен/не должен,
 *   числовые противоречия типа "10 дней" vs "30 дней" при совпадении ключевых слов)
 * — Навигация, подсветка, пометки "решено", экспорты MD/JSON
 * — Готово к интеграции с backend (см. TODO в handleAnalyzeServer)
 */

// ===== Types =====

type Severity = "low" | "medium" | "high";

type Clause = {
  id: string;
  index: number; // 1-based
  text: string;
  header?: string;
  tags?: string[];
};

type FindingBase = {
  id: string;
  severity: Severity;
  reason: string;
  resolved?: boolean;
  createdAt: number;
};

type DuplicateFinding = FindingBase & {
  type: "duplicate";
  items: number[]; // clause indexes involved
  similarity: number; // 0..1 between primary pair
};

type ConflictFinding = FindingBase & {
  type: "conflict";
  a: number; // clause index A
  b: number; // clause index B
  signal: "negation" | "numbers" | "modal" | "policy" | "other";
  meta?: Record<string, any>;
};

type Finding = DuplicateFinding | ConflictFinding;

// ===== Helpers: text processing =====

const RU_STOPWORDS = new Set(
  [
    "и",
    "в",
    "во",
    "не",
    "на",
    "я",
    "с",
    "со",
    "как",
    "а",
    "то",
    "к",
    "ко",
    "до",
    "за",
    "из",
    "у",
    "над",
    "под",
    "о",
    "от",
    "для",
    "по",
    "этот",
    "это",
    "так",
    "также",
    "ли",
    "же",
    "при",
    "или",
    "если",
    "что",
    "чтобы",
    "бы",
    "будет",
    "должен",
    "должна",
  ].map((w) => w.toLowerCase())
);

const POSITIVE_WORDS = [
  "разрешено",
  "допускается",
  "может",
  "вправе",
  "праве",
  "разрешается",
  "должен",
  "обязан",
];
const NEGATIVE_WORDS = [
  "запрещено",
  "не допускается",
  "не вправе",
  "не должен",
  "не обязан",
  "запрещается",
  "не может",
  "нельзя",
];

const NUMBER_RE = /(\d+[\,\.]?\d*)\s*(дн[еяй]?|час(?:ов|а)?|минут(?:а|ы)?|%)?/gi;

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?()"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t && !RU_STOPWORDS.has(t) && t.length > 2);
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function extractNumbers(text: string) {
  const nums: { value: number; unit?: string }[] = [];
  text.replace(NUMBER_RE, (_, v, unit) => {
    const value = parseFloat(String(v).replace(",", "."));
    nums.push({ value, unit: unit?.toLowerCase() });
    return "";
  });
  return nums;
}

function hasAny(text: string, list: string[]): boolean {
  const t = normalize(text);
  return list.some((w) => t.includes(w));
}

function segClauses(raw: string): Clause[] {
  // Пытаемся сегментировать по заголовкам вида "1.", "1)" или "Статья/Пункт/Раздел"
  const lines = raw.split(/\r?\n/);
  const result: Clause[] = [];
  let buf: string[] = [];
  let header: string | undefined;
  const headerRe = /^(\s*(?:Раздел|Статья|Пункт)\s*\d+\.?|\s*\d+[\.|\)]\s*)/i;

  function flush() {
    const text = buf.join("\n").trim();
    if (!text) return;
    result.push({ id: uid("clause"), index: result.length + 1, text, header });
    buf = [];
    header = undefined;
  }

  for (const line of lines) {
    if (headerRe.test(line)) {
      flush();
      header = line.trim();
      // Если заголовок содержит только номер, не теряем следующую строку
      // но записываем его как часть текста
      buf.push(line.replace(headerRe, (m) => m).trim());
    } else {
      buf.push(line);
    }
  }
  flush();

  // Фоллбек: если получилось 1 длинный пункт — режем по пустым строкам или по "." с большой буквы
  if (result.length <= 1) {
    const parts = raw
      .split(/\n\s*\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p, i) => ({ id: uid("clause"), index: i + 1, text: p }));
    }
    // Еще более грубая — по предложениям
    const sentences = raw
      .split(/(?<=[\.!?])\s+(?=[А-ЯA-Z])/g)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (sentences.length > 1) {
      return sentences.map((s, i) => ({ id: uid("clause"), index: i + 1, text: s }));
    }
  }

  return result;
}

function extractKeywords(text: string): string[] {
  // Упрощенная "ключевизация": часто встречающиеся слова (без стоп-слов)
  const tokens = tokenize(text);
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);
}

function likelySameTopic(a: string, b: string): boolean {
  const ka = new Set(extractKeywords(a));
  const kb = new Set(extractKeywords(b));
  let inter = 0;
  for (const k of ka) if (kb.has(k)) inter++;
  return inter >= 2; // общих ключей >=2 — считаем одной темой
}

// ===== Findings detection =====

function computeFindings(clauses: Clause[], dupThreshold = 0.85): Finding[] {
  const findings: Finding[] = [];
  const tokensCache = new Map<number, string[]>();

  const tok = (i: number) => {
    if (!tokensCache.has(i)) tokensCache.set(i, tokenize(clauses[i].text));
    return tokensCache.get(i)!;
  };

  for (let i = 0; i < clauses.length; i++) {
    for (let j = i + 1; j < clauses.length; j++) {
      const A = clauses[i].text;
      const B = clauses[j].text;

      // Duplicates & near-duplicates
      const sim = jaccard(tok(i), tok(j));
      if (sim >= dupThreshold) {
        findings.push({
          id: uid("dup"),
          type: "duplicate",
          items: [clauses[i].index, clauses[j].index],
          similarity: sim,
          severity: sim > 0.92 ? "high" : "medium",
          reason: `Пункты ${clauses[i].index} и ${clauses[j].index} дублируют друг друга (похожесть ${(sim * 100).toFixed(0)}%).`,
          createdAt: Date.now(),
        });
        continue; // не ищем конфликт в явных дублях
      }

      // Potential conflicts
      // 1) Полярность (разрешено vs запрещено)
      const posA = hasAny(A, POSITIVE_WORDS);
      const posB = hasAny(B, POSITIVE_WORDS);
      const negA = hasAny(A, NEGATIVE_WORDS);
      const negB = hasAny(B, NEGATIVE_WORDS);

      if (likelySameTopic(A, B)) {
        if ((posA && negB) || (posB && negA)) {
          findings.push({
            id: uid("conf"),
            type: "conflict",
            a: clauses[i].index,
            b: clauses[j].index,
            signal: "negation",
            severity: "high",
            reason: `Противоречие разрешено/запрещено между пунктами ${clauses[i].index} и ${clauses[j].index}.`,
            createdAt: Date.now(),
            meta: { posA, posB, negA, negB },
          });
          continue;
        }

        // 2) Модальные глаголы: должен/может vs не должен/не может
        const modalPosA = /\b(должен|обязан|может|вправе)\b/i.test(A);
        const modalPosB = /\b(должен|обязан|может|вправе)\b/i.test(B);
        const modalNegA = /\bне\s+(должен|обязан|может|вправе)\b/i.test(A);
        const modalNegB = /\bне\s+(должен|обязан|может|вправе)\b/i.test(B);

        if ((modalPosA && modalNegB) || (modalPosB && modalNegA)) {
          findings.push({
            id: uid("conf"),
            type: "conflict",
            a: clauses[i].index,
            b: clauses[j].index,
            signal: "modal",
            severity: "high",
            reason: `Противоречие по обязанностям/правам между пунктами ${clauses[i].index} и ${clauses[j].index}.`,
            createdAt: Date.now(),
          });
          continue;
        }

        // 3) Числовые расхождения при одинаковой теме
        const numsA = extractNumbers(A);
        const numsB = extractNumbers(B);
        if (numsA.length && numsB.length) {
          // Если есть совпадение по unit или без unit, считаем конфликт, если значения сильно различаются
          const pairs: Array<{ a: number; b: number; unit?: string }> = [];
          for (const na of numsA) {
            for (const nb of numsB) {
              if (!na.unit || !nb.unit || na.unit === nb.unit) {
                pairs.push({ a: na.value, b: nb.value, unit: na.unit || nb.unit });
              }
            }
          }
          if (pairs.length) {
            const maxDiff = Math.max(
              ...pairs.map((p) => Math.abs(p.a - p.b) / Math.max(1, Math.min(p.a, p.b)))
            );
            if (maxDiff >= 0.5) {
              findings.push({
                id: uid("conf"),
                type: "conflict",
                a: clauses[i].index,
                b: clauses[j].index,
                signal: "numbers",
                severity: "medium",
                reason: `Различие числовых значений между пунктами ${clauses[i].index} и ${clauses[j].index} (например, сроки/проценты).`,
                createdAt: Date.now(),
                meta: { pairs },
              });
              continue;
            }
          }
        }
      }
    }
  }

  return dedupeFindings(findings);
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const f of findings) {
    const key =
      f.type === "duplicate"
        ? `${f.type}:${[...f.items].sort().join("-")}`
        : `${f.type}:${[f.a, f.b].sort().join("-")}:${f.signal}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  return out.sort((a, b) => (sevRank(b.severity) - sevRank(a.severity)) || a.createdAt - b.createdAt);
}

function sevRank(s: Severity) {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

// ===== Demo text (RU) =====
const DEMO = `1. Исполнитель вправе использовать результаты работ в портфолио.
2. Исполнителю запрещено использовать результаты работ в любых публичных источниках без согласия Заказчика.
3. Срок оплаты составляет 10 дней с даты подписания Акта.
4. Оплата производится в течение 30 дней после выставления счета.
5. Заказчик обязан предоставить материалы в течение 3 (трех) дней с момента запроса.
6. Заказчик не обязан предоставлять дополнительные материалы сверх ТЗ.
7. Исполнитель может привлекать субподрядчиков.
8. Исполнитель не вправе привлекать третьих лиц без письменного согласия Заказчика.
9. Конфиденциальная информация не подлежит разглашению.
10. Конфиденциальная информация не подлежит разглашению третьим лицам.
`;

// ===== UI Component =====

export default function LegalSandbox() {
  const [raw, setRaw] = useState<string>("");
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [dupThreshold, setDupThreshold] = useState(0.85);
  const [selected, setSelected] = useState<number[]>([]); // highlighted clause indexes
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Init demo
  useEffect(() => {
    const cached = localStorage.getItem("legal-sandbox-text");
    setRaw(cached || DEMO);
  }, []);
  useEffect(() => {
    localStorage.setItem("legal-sandbox-text", raw);
  }, [raw]);

  const counters = useMemo(() => {
    const total = findings.length;
    const byType = {
      duplicate: findings.filter((f) => f.type === "duplicate").length,
      conflict: findings.filter((f) => f.type === "conflict").length,
    };
    return { total, byType };
  }, [findings]);

  function runSegmentation() {
    const out = segClauses(raw);
    setClauses(out);
    setFindings([]);
    setSelected([]);
  }

  function runAnalyzeLocal() {
    if (!clauses.length) runSegmentation();
    const out = computeFindings(clauses, dupThreshold);
    setFindings(out);
  }

  async function handleAnalyzeServer() {
    // Заготовка для будущей интеграции с backend
    // Пример:
    // setLoading(true);
    // const res = await fetch("/api/analyze", { method: "POST", body: JSON.stringify({ clauses }) });
    // const data = await res.json();
    // setFindings(data.findings);
    // setLoading(false);
    // Пока работаем локально
    runAnalyzeLocal();
  }

  function markResolved(id: string, val: boolean) {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, resolved: val } : f)));
  }

  function clearAll() {
    setRaw("");
    setClauses([]);
    setFindings([]);
    setSelected([]);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRaw(String(reader.result || ""));
      setClauses([]);
      setFindings([]);
      setSelected([]);
    };
    reader.readAsText(file, "utf-8");
    e.currentTarget.value = "";
  }

  function focusPair(indices: number[]) {
    setSelected(indices);
    const el = document.getElementById(`clause-${indices[0]}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function exportJSON() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            clauses,
            findings,
            dupThreshold,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    download(url, "legal-sandbox-report.json");
  }

  function exportMarkdown() {
    const md = [
      `# Отчет по юридической песочнице`,
      `Дата: ${new Date().toLocaleString()}`,
      `\n## Пункты (${clauses.length})`,
      ...clauses.map((c) => `**${c.index}.** ${c.text}`),
      `\n## Находки (${findings.length})`,
      ...findings
        .filter((f) => showResolved || !f.resolved)
        .map((f) =>
          f.type === "duplicate"
            ? `- [Дубль | ${sevLabel(f.severity)}] ${f.reason}`
            : `- [Конфликт | ${sevLabel(f.severity)}] (${f.signal}) ${f.reason}`
        ),
    ].join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    download(url, "legal-sandbox-report.md");
  }

  function download(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-linear-to-b from-slate-50 to-white p-4 md:p-6">
        <div className="mx-auto max-w-7xl grid gap-4">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Песочница юридических правок
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportMarkdown}>
                <Download className="w-4 h-4 mr-2" /> MD
              </Button>
              <Button variant="outline" onClick={exportJSON}>
                <Download className="w-4 h-4 mr-2" /> JSON
              </Button>
              <Button variant="destructive" onClick={clearAll}>
                <Eraser className="w-4 h-4 mr-2" /> Очистить
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Editor */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Текст договора
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".txt,.md"
                      className="hidden"
                      ref={fileRef}
                      onChange={handleUpload}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Загрузить .txt
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" onClick={() => setRaw(DEMO)}>
                          <Wand2 className="w-4 h-4 mr-2" /> Демо-текст
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Заполнить примером для прогона</TooltipContent>
                    </Tooltip>
                  </div>
                  <Button onClick={runSegmentation}>
                    <Rows className="w-4 h-4 mr-2" /> Сегментировать
                  </Button>
                </div>
                <Textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder="Вставьте сюда текст договора..."
                  className="min-h-[220px]"
                />
                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Badge variant="secondary">Пунктов: {clauses.length}</Badge>
                    <Badge variant="outline">Находок: {findings.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Порог дублей</span>
                          <Input
                            type="number"
                            min={0.6}
                            max={0.98}
                            step={0.01}
                            value={dupThreshold}
                            onChange={(e) => setDupThreshold(Number(e.target.value))}
                            className="w-24 h-9"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Jaccard-порог похожести (0.85 по умолчанию)</TooltipContent>
                    </Tooltip>
                    <Button onClick={handleAnalyzeServer} disabled={loading}>
                      <Search className="w-4 h-4 mr-2" />
                      {loading ? "Анализ..." : "Найти конфликты и дубли"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: Findings */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Находки
                  <Badge variant="secondary" className="ml-1">
                    {counters.total}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge variant="outline">Дубли: {counters.byType.duplicate}</Badge>
                  <Badge variant="outline">Конфликты: {counters.byType.conflict}</Badge>

                  <div className="ml-auto flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Показывать решённые</span>
                    <Switch checked={showResolved} onCheckedChange={setShowResolved} />
                  </div>
                </div>

                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">Все</TabsTrigger>
                    <TabsTrigger value="duplicates">Дубли</TabsTrigger>
                    <TabsTrigger value="conflicts">Конфликты</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <FindingList
                      findings={findings}
                      showResolved={showResolved}
                      onResolve={markResolved}
                      onFocus={focusPair}
                    />
                  </TabsContent>
                  <TabsContent value="duplicates">
                    <FindingList
                      findings={findings.filter((f) => f.type === "duplicate")}
                      showResolved={showResolved}
                      onResolve={markResolved}
                      onFocus={focusPair}
                    />
                  </TabsContent>
                  <TabsContent value="conflicts">
                    <FindingList
                      findings={findings.filter((f) => f.type === "conflict")}
                      showResolved={showResolved}
                      onResolve={markResolved}
                      onFocus={focusPair}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Clause viewer */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" /> Пункты ({clauses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {clauses.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    Сегментируйте текст, чтобы увидеть пункты.
                  </p>
                )}
                <AnimatePresence>
                  {clauses.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <ClauseCard clause={c} selected={selected.includes(c.index)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function FindingList({
  findings,
  showResolved,
  onResolve,
  onFocus,
}: {
  findings: Finding[];
  showResolved: boolean;
  onResolve: (id: string, val: boolean) => void;
  onFocus: (indices: number[]) => void;
}) {
  const visible = findings.filter((f) => showResolved || !f.resolved);
  if (visible.length === 0)
    return <p className="text-slate-500 text-sm">Нет находок для отображения.</p>;

  return (
    <div className="grid gap-3">
      {visible.map((f) => (
        <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="border rounded-2xl p-3 md:p-4 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={f.type === "duplicate" ? "secondary" : "destructive"}>
                {f.type === "duplicate" ? (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Дубль
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Конфликт
                  </>
                )}
              </Badge>
              <SeverityBadge severity={f.severity} />
              {f.type === "duplicate" && (
                <Badge variant="outline">Похожесть {Math.round(f.similarity * 100)}%</Badge>
              )}
              {f.type === "conflict" && <Badge variant="outline">Сигнал: {signalLabel(f.signal)}</Badge>}
              {f.resolved && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <Check className="w-3.5 h-3.5 mr-1" /> Решено
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onFocus(
                      f.type === "duplicate" ? (f.items as number[]) : [f.a, f.b]
                    )
                  }
                >
                  <Link2 className="w-4 h-4 mr-1" /> К пунктам
                </Button>
                <Button
                  size="sm"
                  variant={f.resolved ? "secondary" : "default"}
                  onClick={() => onResolve(f.id, !f.resolved)}
                >
                  {f.resolved ? (
                    <>
                      <X className="w-4 h-4 mr-1" /> Снять метку
                    </>
                  ) : (
                    <>
                      <ListChecks className="w-4 h-4 mr-1" /> Отметить решённым
                    </>
                  )}
                </Button>
                {f.type === "duplicate" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline">
                        <GitMerge className="w-4 h-4 mr-1" /> Объединить
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      UI-заглушка: здесь можно реализовать выбор базового пункта и перенос
                      формулировок/ссылок.
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Скрыть из списка (soft-delete)</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{f.reason}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ClauseCard({ clause, selected }: { clause: Clause; selected?: boolean }) {
  return (
    <div
      id={`clause-${clause.index}`}
      className={
        "rounded-2xl border p-4 bg-white shadow-sm transition-all " +
        (selected ? "ring-2 ring-blue-400" : "hover:shadow-md")
      }
    >
      <div className="flex items-start gap-3">
        <div className="select-none inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-semibold">
          {clause.index}
        </div>
        <div className="flex-1">
          {clause.header && (
            <div className="text-slate-700 font-medium mb-1">{clause.header}</div>
          )}
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{clause.text}</div>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-sky-50 text-sky-700 border-sky-200",
  };
  const label = sevLabel(severity);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${map[severity]}`}>
      {severity === "high" && <AlertTriangle className="w-3.5 h-3.5" />}
      {severity === "medium" && <AlertTriangle className="w-3.5 h-3.5" />}
      {severity === "low" && <AlertTriangle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

function sevLabel(s: Severity) {
  return s === "high" ? "высокая" : s === "medium" ? "средняя" : "низкая";
}

function signalLabel(s: ConflictFinding["signal"]) {
  switch (s) {
    case "negation":
      return "разрешено/запрещено";
    case "numbers":
      return "цифры/сроки";
    case "modal":
      return "обязан/может";
    case "policy":
      return "политика";
    default:
      return s;
  }
}
