"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
<<<<<<< HEAD
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
=======
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  Download,
  Eraser,
  Eye,
  FileText,
<<<<<<< HEAD
  GitMerge,
  Link2,
  ListChecks,
  Rows,
  Scale,
=======
  Filter,
  Rows,
  Save,
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  Search,
  Trash2,
  Upload,
  Wand2,
<<<<<<< HEAD
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
=======
} from "lucide-react";

import ClauseCard from "@/components/ClauseCard";
import FindingList from "@/components/FindingList";
import { useAuth } from "@/context/AuthContext";
import {
  analyzeText,
  createDoc,
  deleteDoc,
  deleteFile,
  fetchDocs,
  fetchFiles,
  getFileLink,
  type Attachment,
  type Document,
  segmentText,
  updateDoc,
  uploadFile,
} from "@/lib/api";
import { Clause, Finding, Severity } from "@/lib/types";
import { computeFindings, DEMO_TEXT, segClauses } from "@/lib/utils";

const STATUS_OPTIONS = ["draft", "review", "approved", "archived"] as const;
const SORT_OPTIONS = [
  { value: "updated_at", label: "Сначала новые" },
  { value: "created_at", label: "По дате создания" },
  { value: "title", label: "По названию" },
  { value: "status", label: "По статусу" },
  { value: "category", label: "По категории" },
] as const;

export default function LegalSandbox() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("Новый документ");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("draft");
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [dupThreshold, setDupThreshold] = useState(0.85);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
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
=======
  const [docsLoading, setDocsLoading] = useState(false);
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsMeta, setDocsMeta] = useState({ total: 0, page: 1, page_size: 6, pages: 1 });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [docError, setDocError] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [lastAnalysisMode, setLastAnalysisMode] = useState<"server" | "local" | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";
  const statusFilter = searchParams.get("status") || "";
  const sortBy = searchParams.get("sort") || "updated_at";
  const page = Number(searchParams.get("page") || 1);
>>>>>>> 73dd6ff (С 1й по 3ю и docker)

  useEffect(() => {
    const cached = localStorage.getItem("legal-sandbox-text");
    setRaw(cached || DEMO_TEXT);
  }, []);

  useEffect(() => {
    localStorage.setItem("legal-sandbox-text", raw);
  }, [raw]);

<<<<<<< HEAD
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
=======
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setDocsLoading(true);
        const response = await fetchDocs({
          q: query || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          sort_by: sortBy,
          page,
        });
        if (!cancelled) {
          setDocs(response.items);
          setDocsMeta(response.meta);
          setDocError(null);
        }
      } catch (error: any) {
        if (!cancelled) setDocError(error?.data?.detail || error?.message || "Не удалось загрузить документы");
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, query, categoryFilter, statusFilter, sortBy, page]);

  useEffect(() => {
    if (!user || !activeDocId) {
      setAttachments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchFiles(activeDocId);
        if (!cancelled) setAttachments(list);
      } catch (error: any) {
        if (!cancelled) setDocError(error?.data?.detail || error?.message || "Не удалось загрузить файлы");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, activeDocId]);

  useEffect(() => {
    if (!clauses.length || !hasAnalyzed || lastAnalysisMode === "server") return;
    setFindings(computeFindings(clauses, dupThreshold));
  }, [clauses, dupThreshold, hasAnalyzed, lastAnalysisMode]);

  const counters = useMemo(() => ({
    total: findings.length,
    duplicate: findings.filter((item) => item.type === "duplicate").length,
    conflict: findings.filter((item) => item.type === "conflict").length,
  }), [findings]);

  const canDeleteDoc = (doc?: Document | null) => Boolean(doc && (doc.owner_id === user?.id || user?.role === "admin"));

  function updateSearch(next: Record<string, string | number | null | undefined>, resetPage = false) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    if (resetPage) params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetDerivedState(nextRaw?: string) {
    if (typeof nextRaw === "string") setRaw(nextRaw);
    setClauses([]);
    setFindings([]);
    setSelected([]);
    setLastAnalysisMode(null);
    setHasAnalyzed(false);
  }

  async function runSegmentation() {
    const text = raw.trim();
    if (!text) return resetDerivedState("");
    try {
      setLoading(true);
      const response = await segmentText({ text });
      setClauses(response.clauses as Clause[]);
      setFindings([]);
      setSelected([]);
      setLastAnalysisMode("server");
      setHasAnalyzed(false);
    } catch {
      const localClauses = segClauses(text);
      setClauses(localClauses);
      setFindings([]);
      setSelected([]);
      setLastAnalysisMode("local");
      setHasAnalyzed(false);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalyze() {
    const text = raw.trim();
    if (!text) return resetDerivedState("");
    try {
      setLoading(true);
      const response = await analyzeText({ text, dup_threshold: dupThreshold });
      setClauses(response.clauses as Clause[]);
      setFindings(response.findings as Finding[]);
      setSelected([]);
      setLastAnalysisMode("server");
      setHasAnalyzed(true);
    } catch {
      const localClauses = segClauses(text);
      setClauses(localClauses);
      setFindings(computeFindings(localClauses, dupThreshold));
      setSelected([]);
      setLastAnalysisMode("local");
      setHasAnalyzed(true);
    } finally {
      setLoading(false);
    }
  }

  async function reloadDocs() {
    const response = await fetchDocs({
      q: query || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      sort_by: sortBy,
      page,
    });
    setDocs(response.items);
    setDocsMeta(response.meta);
  }

  async function saveCurrentDocument() {
    if (!title.trim()) {
      setDocError("У документа должно быть название.");
      return;
    }
    if (!raw.trim()) {
      setDocError("Добавь текст договора перед сохранением.");
      return;
    }
    try {
      setLoading(true);
      if (activeDocId) {
        const updated = await updateDoc(activeDocId, { title, text: raw, category, status });
        setActiveDocId(updated.id);
      } else {
        const created = await createDoc({ title, text: raw, category, status });
        setActiveDocId(created.id);
      }
      await reloadDocs();
      setDocError(null);
    } catch (error: any) {
      setDocError(error?.data?.detail || error?.message || "Не удалось сохранить документ");
    } finally {
      setLoading(false);
    }
  }

  async function removeDocument(docId: number) {
    try {
      setLoading(true);
      await deleteDoc(docId);
      if (activeDocId === docId) {
        setActiveDocId(null);
        setAttachments([]);
      }
      await reloadDocs();
    } catch (error: any) {
      setDocError(error?.data?.detail || error?.message || "Не удалось удалить документ");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadAttachment(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file || !activeDocId) return;
    try {
      setLoading(true);
      await uploadFile(activeDocId, file);
      setAttachments(await fetchFiles(activeDocId));
      setDocError(null);
    } catch (error: any) {
      setDocError(error?.data?.detail || error?.message || "Не удалось загрузить файл");
    } finally {
      setLoading(false);
    }
  }

  function loadDoc(doc: Document) {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setCategory(doc.category);
    setStatus(doc.status as (typeof STATUS_OPTIONS)[number]);
    setRaw(doc.text);
    setClauses([]);
    setFindings([]);
    setSelected([]);
    setLastAnalysisMode(null);
    setHasAnalyzed(false);
  }

  function markResolved(id: string, value: boolean) {
    setFindings((current) => current.map((item) => (item.id === id ? { ...item, resolved: value } : item)));
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  }

  function clearAll() {
    setRaw("");
<<<<<<< HEAD
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
=======
    setTitle("Новый документ");
    setCategory("general");
    setStatus("draft");
    setClauses([]);
    setFindings([]);
    setSelected([]);
    setActiveDocId(null);
    setAttachments([]);
    setLastAnalysisMode(null);
    setHasAnalyzed(false);
  }

  function handleUploadText(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const isSupported = /\.(txt|md)$/i.test(file.name);
    if (!isSupported) {
      setDocError("Для текста поддерживаются только .txt и .md");
      event.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDocError(null);
      resetDerivedState(String(reader.result || ""));
    };
    reader.onerror = () => setDocError("Не удалось прочитать файл");
    reader.readAsText(file, "utf-8");
    event.currentTarget.value = "";
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  }

  function focusPair(indices: number[]) {
    setSelected(indices);
<<<<<<< HEAD
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
=======
    document.getElementById(`clause-${indices[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function download(url: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function exportJSON() {
    const blob = new Blob([
      JSON.stringify({ generatedAt: new Date().toISOString(), title, category, status, clauses, findings, dupThreshold }, null, 2),
    ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    download(url, "legal-sandbox-report.json");
    URL.revokeObjectURL(url);
  }

  function exportMarkdown() {
    const severityLabel = (severity: Severity) => severity === "high" ? "высокая" : severity === "medium" ? "средняя" : "низкая";
    const markdown = [
      `# ${title}`,
      `Категория: ${category}`,
      `Статус: ${status}`,
      `Дата: ${new Date().toLocaleString()}`,
      `\n## Пункты (${clauses.length})`,
      ...clauses.map((clause) => `**${clause.index}.** ${clause.text}`),
      `\n## Находки (${findings.length})`,
      ...findings.filter((item) => showResolved || !item.resolved).map((item) => item.type === "duplicate"
        ? `- [Дубль | ${severityLabel(item.severity)}] ${item.reason}`
        : `- [Конфликт | ${severityLabel(item.severity)}] (${item.signal}) ${item.reason}`),
    ].join("\n\n");
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    download(url, "legal-sandbox-report.md");
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    URL.revokeObjectURL(url);
  }

  return (
<<<<<<< HEAD
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
=======
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4">
        <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Contract intelligence workspace</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Legal Sandbox</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                ЛР 1–3: роли и права, access/refresh сессии, фильтруемый реестр документов и загрузка файлов в объектное хранилище.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border px-3 py-1 text-slate-700">Роль: {user?.role}</span>
              <span className="rounded-full border px-3 py-1 text-slate-700">Документов: {docsMeta.total}</span>
              <span className="rounded-full border px-3 py-1 text-slate-700">Файлов у активного документа: {attachments.length}</span>
            </div>
          </div>
        </section>

        {docError && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{docError}</div>}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5" /> Документ</div>
            <div className="grid gap-3 md:grid-cols-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border p-3" placeholder="Название документа" />
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border p-3" placeholder="Категория" />
              <select value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])} className="rounded-xl border p-3">
                {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <input type="file" accept=".txt,.md" className="hidden" ref={fileRef} onChange={handleUploadText} />
              <button onClick={() => fileRef.current?.click()} className="rounded-xl border px-4 py-2 text-sm"><Upload className="mr-2 inline h-4 w-4" />Загрузить текст</button>
              <button onClick={() => resetDerivedState(DEMO_TEXT)} className="rounded-xl border px-4 py-2 text-sm"><Wand2 className="mr-2 inline h-4 w-4" />Демо</button>
              <button onClick={runSegmentation} disabled={loading} className="rounded-xl border px-4 py-2 text-sm"><Rows className="mr-2 inline h-4 w-4" />Сегментировать</button>
              <button onClick={runAnalyze} disabled={loading} className="rounded-xl bg-slate-950 px-4 py-2 text-sm text-white"><Search className="mr-2 inline h-4 w-4" />{loading ? "Анализ…" : "Анализ"}</button>
              <button onClick={saveCurrentDocument} disabled={loading} className="rounded-xl border px-4 py-2 text-sm"><Save className="mr-2 inline h-4 w-4" />{activeDocId ? "Обновить" : "Сохранить"}</button>
              <button onClick={clearAll} className="rounded-xl border px-4 py-2 text-sm"><Eraser className="mr-2 inline h-4 w-4" />Очистить</button>
              <button onClick={exportMarkdown} className="rounded-xl border px-4 py-2 text-sm"><Download className="mr-2 inline h-4 w-4" />MD</button>
              <button onClick={exportJSON} className="rounded-xl border px-4 py-2 text-sm"><Download className="mr-2 inline h-4 w-4" />JSON</button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <textarea
                value={raw}
                onChange={(event) => resetDerivedState(event.target.value)}
                placeholder="Вставьте сюда текст договора..."
                className="min-h-72 rounded-2xl border p-4"
              />
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
                <div>Пунктов: <strong>{clauses.length}</strong></div>
                <div>Находок: <strong>{findings.length}</strong></div>
                <div className="mt-3">Порог дублей</div>
                <input type="number" min={0.6} max={0.98} step={0.01} value={dupThreshold} onChange={(e) => setDupThreshold(Number(e.target.value))} className="mt-1 w-24 rounded-xl border p-2" />
                {lastAnalysisMode && <div className="mt-3 text-xs">Режим: {lastAnalysisMode === "server" ? "API" : "local fallback"}</div>}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5" /> Находки</div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full border px-3 py-1">Всего: {counters.total}</span>
              <span className="rounded-full border px-3 py-1">Дубли: {counters.duplicate}</span>
              <span className="rounded-full border px-3 py-1">Конфликты: {counters.conflict}</span>
              <label className="ml-auto flex items-center gap-2">
                <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                показывать решённые
              </label>
            </div>
            <FindingList findings={findings} showResolved={showResolved} onResolve={markResolved} onFocus={focusPair} />
          </section>
        </div>

        <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-lg font-semibold"><Filter className="h-5 w-5" /> Реестр документов</div>
            <div className="text-sm text-slate-500">Фильтры сохраняются в query params</div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input value={query} onChange={(e) => updateSearch({ q: e.target.value }, true)} placeholder="Поиск по названию и тексту" className="rounded-xl border p-3" />
            <input value={categoryFilter} onChange={(e) => updateSearch({ category: e.target.value }, true)} placeholder="Категория" className="rounded-xl border p-3" />
            <select value={statusFilter} onChange={(e) => updateSearch({ status: e.target.value }, true)} className="rounded-xl border p-3">
              <option value="">Все статусы</option>
              {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => updateSearch({ sort: e.target.value }, true)} className="rounded-xl border p-3">
              {SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div>
              {docsLoading ? (
                <div className="rounded-2xl border p-6 text-sm text-slate-500">Загрузка документов…</div>
              ) : docs.length === 0 ? (
                <div className="rounded-2xl border p-6 text-sm text-slate-500">Документы по текущим фильтрам не найдены.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className={`rounded-2xl border p-4 shadow-sm transition ${activeDocId === doc.id ? "border-slate-900 bg-slate-50" : "bg-white"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{doc.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{doc.category} · {doc.status}</div>
                          <div className="mt-1 text-xs text-slate-500">Обновлён: {new Date(doc.updated_at).toLocaleString()}</div>
                          {user?.role !== "user" && <div className="mt-1 text-xs text-slate-500">Owner #{doc.owner_id}</div>}
                        </div>
                        <span className="rounded-full border px-2 py-1 text-xs">#{doc.id}</span>
                      </div>
                      <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm text-slate-600">{doc.text}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => loadDoc(doc)} className="rounded-xl border px-3 py-2 text-sm">Открыть</button>
                        {canDeleteDoc(doc) && (
                          <button onClick={() => removeDocument(doc.id)} className="rounded-xl border px-3 py-2 text-sm text-red-700">
                            <Trash2 className="mr-1 inline h-4 w-4" />Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>Страница {docsMeta.page} из {docsMeta.pages}</span>
                <div className="flex gap-2">
                  <button disabled={docsMeta.page <= 1} onClick={() => updateSearch({ page: docsMeta.page - 1 })} className="rounded-xl border px-3 py-2 disabled:opacity-50">Назад</button>
                  <button disabled={docsMeta.page >= docsMeta.pages} onClick={() => updateSearch({ page: docsMeta.page + 1 })} className="rounded-xl border px-3 py-2 disabled:opacity-50">Дальше</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold"><Upload className="h-5 w-5" /> Файлы документа</div>
              {!activeDocId ? (
                <p className="text-sm text-slate-500">Сначала сохрани или открой документ, потом можно прикреплять PDF, DOC/DOCX, TXT и Markdown.</p>
              ) : (
                <>
                  <input ref={uploadRef} type="file" className="hidden" onChange={handleUploadAttachment} />
                  <button onClick={() => uploadRef.current?.click()} className="rounded-xl border px-4 py-2 text-sm">Загрузить файл</button>
                  <p className="mt-2 text-xs text-slate-500">Ограничения проверяются на сервере: тип и размер файла.</p>
                  <div className="mt-4 grid gap-3">
                    {attachments.length === 0 ? (
                      <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">Файлы ещё не загружены.</div>
                    ) : attachments.map((file) => (
                      <div key={file.id} className="rounded-xl border bg-white p-4">
                        <div className="font-medium">{file.original_name}</div>
                        <div className="mt-1 text-xs text-slate-500">{file.content_type} · {(file.size_bytes / 1024).toFixed(1)} KB</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              const link = await getFileLink(file.id);
                              window.open(link.url, "_blank", "noopener,noreferrer");
                            }}
                            className="rounded-xl border px-3 py-2 text-sm"
                          >
                            Скачать / открыть
                          </button>
                          {(file.owner_id === user?.id || user?.role === "admin" || user?.role === "manager") && (
                            <button
                              onClick={async () => {
                                await deleteFile(file.id);
                                if (activeDocId) setAttachments(await fetchFiles(activeDocId));
                              }}
                              className="rounded-xl border px-3 py-2 text-sm text-red-700"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold"><Eye className="h-5 w-5" /> Пункты ({clauses.length})</div>
          <div className="grid gap-3">
            {clauses.length === 0 && <p className="text-sm text-slate-500">Сегментируйте текст, чтобы увидеть пункты.</p>}
            <AnimatePresence>
              {clauses.map((clause) => (
                <motion.div key={clause.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <ClauseCard clause={clause} selected={selected.includes(clause.index)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
