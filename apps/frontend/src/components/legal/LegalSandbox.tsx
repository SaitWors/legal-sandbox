"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchDocs, createDoc } from "@/lib/api";
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
import { 
  Clause, 
  Finding, 
  DuplicateFinding, 
  ConflictFinding,
  Severity 
} from "@/lib/types";
import { 
  segClauses, 
  computeFindings,
  DEMO_TEXT 
} from "@/lib/utils";
import FindingList from "@/components/FindingList";
import ClauseCard from "@/components/ClauseCard";

export default function LegalSandbox() {
  const [raw, setRaw] = useState<string>("");
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [dupThreshold, setDupThreshold] = useState(0.85);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // загрузка списка документов при старте
    (async () => {
      try {
        const list = await fetchDocs();
        setDocs(list);
      } catch (e) {
        // не крашить UI — показываем в консоль
        console.warn("Ошибка загрузки документов:", e);
      }
    })();
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("legal-sandbox-text");
    setRaw(cached || DEMO_TEXT);
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
    // TODO: Backend integration
    runAnalyzeLocal();
  }

  async function saveCurrentAsDocument() {
    try {
      const defaultTitle = `Документ ${new Date().toLocaleString()}`;
      const title = prompt("Название документа:", defaultTitle) || defaultTitle;
      await createDoc({ title, text: raw });
      // перезагрузим список
      const list = await fetchDocs();
      setDocs(list);
      alert("Сохранено");
    } catch (err: any) {
      alert("Ошибка сохранения: " + (err.message || err));
    }
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
    const sevLabel = (s: Severity) => s === "high" ? "высокая" : s === "medium" ? "средняя" : "низкая";
    
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
            <Button onClick={saveCurrentAsDocument}>
              <Upload className="w-4 h-4 mr-2" /> Сохранить документ
            </Button>

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
                      <Button type="button" variant="outline" onClick={() => setRaw(DEMO_TEXT)}>
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
                className="min-h-55"
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
        <Card className="shadow-sm mt-6">
          <CardHeader><CardTitle>Сохранённые документы</CardTitle></CardHeader>
          <CardContent>
            {docs.length === 0 ? <p>Нет документов</p> : docs.map(d => (
              <div key={d.id} className="border p-2 mb-2">
                <div className="font-bold">{d.title}</div>
                <div className="text-sm whitespace-pre-wrap">{d.text}</div>
              </div>
            ))}
          </CardContent>
        </Card>

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
  );
}