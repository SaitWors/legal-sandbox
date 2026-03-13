import { Clause, Finding, Severity } from "./types";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const DEMO_TEXT = `1. Исполнитель вправе использовать результаты работ в портфолио.
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

const RU_STOPWORDS = new Set(
  [
    "и", "в", "во", "не", "на", "я", "с", "со", "как", "а", "то", "к", "ко",
    "до", "за", "из", "у", "над", "под", "о", "от", "для", "по", "этот",
    "это", "так", "также", "ли", "же", "при", "или", "если", "что", "чтобы",
    "бы", "будет", "должен", "должна",
  ].map((w) => w.toLowerCase())
);

const POSITIVE_WORDS = [
  "разрешено", "допускается", "может", "вправе", "праве", "разрешается", "должен", "обязан",
];
const NEGATIVE_WORDS = [
  "запрещено", "не допускается", "не вправе", "не должен", "не обязан", "запрещается", "не может", "нельзя",
];

const NUMBER_RE = /(\d+[\,\.]?\d*)\s*(дн[еяй]?|час(?:ов|а)?|минут(?:а|ы)?|%)?/gi;

export function uid(prefix = "id"): string {
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

export function segClauses(raw: string): Clause[] {
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
      buf.push(line.replace(headerRe, (m) => m).trim());
    } else {
      buf.push(line);
    }
  }
  flush();

  if (result.length <= 1) {
    const parts = raw
      .split(/\n\s*\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p, i) => ({ id: uid("clause"), index: i + 1, text: p }));
    }
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
  return inter >= 2;
}

function sevRank(s: Severity) {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
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

export function computeFindings(clauses: Clause[], dupThreshold = 0.85): Finding[] {
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
        continue;
      }

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

        const numsA = extractNumbers(A);
        const numsB = extractNumbers(B);
        if (numsA.length && numsB.length) {
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