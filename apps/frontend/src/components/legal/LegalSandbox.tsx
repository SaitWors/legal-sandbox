"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, FileUp, RefreshCcw, Search, Sparkles, Trash2 } from "lucide-react";

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
import { mergeSearchParams, positiveInt } from "@/lib/search-state";
import { type ApiError, getErrorMessage } from "@/lib/api";
import { Clause, Finding } from "@/lib/types";
import { computeFindings, DEMO_TEXT, segClauses } from "@/lib/utils";

const STATUS_OPTIONS = ["draft", "review", "approved", "archived"] as const;
const SORT_OPTIONS = [
  { value: "updated_at", label: "Сначала новые" },
  { value: "created_at", label: "По дате создания" },
  { value: "title", label: "По названию" },
  { value: "status", label: "По статусу" },
  { value: "category", label: "По категории" },
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

export default function LegalSandbox() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uploadRef = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("Новый документ");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("draft");
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [dupThreshold, setDupThreshold] = useState(0.85);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
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
  const page = positiveInt(searchParams.get("page") || "1", 1);

  const counters = useMemo(() => ({
    total: findings.length,
    duplicates: findings.filter((item) => item.type === "duplicate").length,
    conflicts: findings.filter((item) => item.type === "conflict").length,
  }), [findings]);

  const updateQuery = (updates: Record<string, string | number | null>) => {
    const next = mergeSearchParams(searchParams.toString(), updates);
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem("contract-workspace-text");
    setRaw(cached || DEMO_TEXT);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("contract-workspace-text", raw);
  }, [raw]);

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
          page_size: 6,
        });
        if (!cancelled) {
          setDocs(response.items);
          setDocsMeta(response.meta);
          setDocError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) setDocError(getErrorMessage(err as ApiError, "Не удалось загрузить документы"));
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
      } catch (err: unknown) {
        if (!cancelled) setDocError(getErrorMessage(err as ApiError, "Не удалось загрузить файлы"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, activeDocId]);

  const runSegmentationLocal = () => {
    const result = segClauses(raw);
    setClauses(result);
    setFindings([]);
    setSelected([]);
    setHasAnalyzed(false);
  };

  const runSegmentationServer = async () => {
    const response = await segmentText(raw);
    setClauses(response.clauses);
    setFindings([]);
    setSelected([]);
    setHasAnalyzed(false);
  };

  const runAnalyzeLocal = () => {
    const localClauses = clauses.length ? clauses : segClauses(raw);
    const result = computeFindings(localClauses, dupThreshold);
    setClauses(localClauses);
    setFindings(result);
    setLastAnalysisMode("local");
    setHasAnalyzed(true);
  };

  const runAnalyzeServer = async () => {
    const response = await analyzeText(raw, dupThreshold);
    setClauses(response.clauses);
    setFindings(response.findings);
    setLastAnalysisMode("server");
    setHasAnalyzed(true);
  };

  const saveDocument = async () => {
    setLoading(true);
    try {
      if (activeDocId) {
        const updated = await updateDoc(activeDocId, { title, text: raw, category, status });
        setActiveDocId(updated.id);
      } else {
        const created = await createDoc({ title, text: raw, category, status });
        setActiveDocId(created.id);
      }
      updateQuery({ page: 1 });
      const response = await fetchDocs({ page: 1, page_size: 6, sort_by: sortBy, q: query || undefined, category: categoryFilter || undefined, status: statusFilter || undefined });
      setDocs(response.items);
      setDocsMeta(response.meta);
      setDocError(null);
    } catch (err: unknown) {
      setDocError(getErrorMessage(err as ApiError, "Не удалось сохранить документ"));
    } finally {
      setLoading(false);
    }
  };

  const loadDocument = (doc: Document) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setRaw(doc.text);
    setCategory(doc.category);
    setStatus((doc.status as (typeof STATUS_OPTIONS)[number]) || "draft");
    setClauses([]);
    setFindings([]);
    setSelected([]);
    setHasAnalyzed(false);
  };

  const resetEditor = () => {
    setActiveDocId(null);
    setTitle("Новый документ");
    setRaw(DEMO_TEXT);
    setCategory("general");
    setStatus("draft");
    setClauses([]);
    setFindings([]);
    setSelected([]);
    setAttachments([]);
    setHasAnalyzed(false);
    setLastAnalysisMode(null);
  };

  const removeDocument = async (docId: number) => {
    if (!confirm("Удалить документ?")) return;
    try {
      await deleteDoc(docId);
      if (activeDocId === docId) resetEditor();
      updateQuery({ page: 1 });
    } catch (err: unknown) {
      setDocError(getErrorMessage(err as ApiError, "Не удалось удалить документ"));
    }
  };

  const focusClauses = (indices: number[]) => {
    setSelected(indices);
    const target = document.getElementById(`clause-${indices[0]}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const markResolved = (id: string, value: boolean) => {
    setFindings((current) => current.map((item) => (item.id === id ? { ...item, resolved: value } : item)));
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeDocId) return;
    try {
      await uploadFile(activeDocId, file);
      setAttachments(await fetchFiles(activeDocId));
    } catch (err: unknown) {
      setDocError(getErrorMessage(err as ApiError, "Не удалось загрузить файл"));
    } finally {
      event.target.value = "";
    }
  };

  const onDownload = async (fileId: number) => {
    try {
      const response = await getFileLink(fileId);
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      setDocError(getErrorMessage(err as ApiError, "Не удалось получить ссылку на файл"));
    }
  };

  const onDeleteFile = async (fileId: number) => {
    try {
      await deleteFile(fileId);
      if (activeDocId) setAttachments(await fetchFiles(activeDocId));
    } catch (err: unknown) {
      setDocError(getErrorMessage(err as ApiError, "Не удалось удалить файл"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Закрытый рабочий раздел
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Рабочая область документов</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            В этом разделе собраны основные операции с документами: создание, поиск, фильтрация, анализ текста,
            работа с вложениями и восстановление сессии без повторного входа.
          </p>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <div className="text-sm text-slate-300">Текущий пользователь</div>
          <div className="text-2xl font-semibold">{user?.username}</div>
          <div className="text-sm text-slate-300">Роль: {user?.role}</div>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-lg font-semibold text-white">{docsMeta.total}</div>Документов</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-lg font-semibold text-white">{counters.conflicts}</div>Конфликтов</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-lg font-semibold text-white">{attachments.length}</div>Файлов</div>
          </div>
        </div>
      </section>

      {docError && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{docError}</div>}

      <section className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Реестр документов</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">Фильтры, сортировка и пагинация сохраняются в адресной строке.</p>
              </div>
              <button onClick={resetEditor} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Новый документ</button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  defaultValue={query}
                  placeholder="Поиск по названию или тексту"
                  className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 text-sm"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateQuery({ q: (event.target as HTMLInputElement).value, page: 1 });
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  defaultValue={categoryFilter}
                  placeholder="Категория"
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") updateQuery({ category: (event.target as HTMLInputElement).value, page: 1 });
                  }}
                />
                <select value={statusFilter} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm">
                  <option value="">Все статусы</option>
                  {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select value={sortBy} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm">
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button onClick={() => updateQuery({ q: null, category: null, status: null, sort: "updated_at", page: 1 })} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Сбросить фильтры</button>
            </div>

            <div className="mt-6 space-y-3">
              {docsLoading ? (
                <div className="text-sm text-slate-500">Загрузка документов…</div>
              ) : docs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Документы не найдены.</div>
              ) : docs.map((doc) => (
                <article key={doc.id} className={`rounded-2xl border p-4 transition ${activeDocId === doc.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{doc.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{doc.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{doc.status}</span>
                        <span>Обновлён: {formatDate(doc.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadDocument(doc)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700">Открыть</button>
                      <button onClick={() => void removeDocument(doc.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Удалить</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>Страница {docsMeta.page} из {docsMeta.pages}</span>
              <div className="flex gap-2">
                <button disabled={docsMeta.page <= 1} onClick={() => updateQuery({ page: docsMeta.page - 1 })} className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50">Назад</button>
                <button disabled={docsMeta.page >= docsMeta.pages} onClick={() => updateQuery({ page: docsMeta.page + 1 })} className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50">Вперёд</button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Вложения документа</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">Файлы доступны только в рамках прав текущей роли. Для локального режима используются защищённые ссылки на скачивание.</p>
              </div>
              <button disabled={!activeDocId} onClick={() => uploadRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700 disabled:opacity-50">
                <FileUp className="h-4 w-4" /> Загрузить
              </button>
              <input ref={uploadRef} type="file" className="hidden" onChange={(event) => void onUpload(event)} />
            </div>
            <div className="mt-6 space-y-3">
              {!activeDocId ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Сначала выбери документ.</div>
              ) : attachments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Вложений пока нет.</div>
              ) : attachments.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="font-medium text-slate-900">{item.original_name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.content_type} • {item.size_bytes} bytes</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void onDownload(item.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><Download className="h-4 w-4" /> Скачать</button>
                    <button onClick={() => void onDeleteFile(item.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><Trash2 className="h-4 w-4" /> Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" placeholder="Название документа" />
              <input value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm" placeholder="Категория" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
              <select value={status} onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm">
                {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <button onClick={() => void saveDocument()} disabled={loading} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70">
                {loading ? "Сохраняем…" : activeDocId ? "Обновить документ" : "Сохранить документ"}
              </button>
            </div>
            <textarea value={raw} onChange={(event) => setRaw(event.target.value)} className="mt-4 min-h-[240px] w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm leading-7" />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={runSegmentationLocal} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Сегментация локально</button>
              <button onClick={() => void runSegmentationServer()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Сегментация через API</button>
              <button onClick={runAnalyzeLocal} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"><RefreshCcw className="h-4 w-4" /> Анализ локально</button>
              <button onClick={() => void runAnalyzeServer()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"><Sparkles className="h-4 w-4" /> Анализ через backend</button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <label className="flex items-center gap-2">
                <span>Порог дублей</span>
                <input type="number" min="0.6" max="0.98" step="0.01" value={dupThreshold} onChange={(event) => setDupThreshold(Number(event.target.value))} className="h-10 w-24 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> Показывать решённые
              </label>
              {lastAnalysisMode && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Последний анализ: {lastAnalysisMode === "server" ? "сервер" : "локально"}</span>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Найденные проблемы</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Конфликты и дубли показывают нагрузочные точки документа. Переход к пунктам работает прямо из списка.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Всего: {counters.total}</span>
              <span>Дубли: {counters.duplicates}</span>
              <span>Конфликты: {counters.conflicts}</span>
            </div>
            <div className="mt-6">
              {hasAnalyzed ? (
                <FindingList findings={findings} showResolved={showResolved} onResolve={markResolved} onFocus={focusClauses} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Запусти анализ, чтобы увидеть результат.</div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Сегменты документа</h2>
            <div className="mt-6 grid gap-3">
              {clauses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Пока нет сегментов. Запусти сегментацию или анализ.</div>
              ) : (
                clauses.map((clause) => <ClauseCard key={clause.id} clause={clause} selected={selected.includes(clause.index)} />)
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
