"use client";

import { useState } from "react";

import { type ApiError, fetchTermInsights, type ExternalTermsResponse, getErrorMessage } from "@/lib/api";

export default function TermInsightsClient() {
  const [term, setTerm] = useState("договор");
  const [data, setData] = useState<ExternalTermsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (nextTerm?: string) => {
    const value = (nextTerm ?? term).trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTermInsights(value);
      setData(response);
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError, "Сервис подсказок временно недоступен, но основная часть приложения продолжает работать."));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Подсказки по юридическим терминам</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Блок показывает, как внешние данные подключаются через backend-слой с таймаутами,
        контролем ошибок и кэшированием, не открывая клиенту прямой доступ к стороннему сервису.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          className="h-11 flex-1 rounded-2xl border border-slate-200 px-4 text-sm outline-none ring-0 transition focus:border-slate-400"
          placeholder="Например: договор"
        />
        <button
          onClick={() => void handleSearch()}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {loading ? "Загрузка…" : "Получить подсказки"}
        </button>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

      {data && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Источник: {data.source}</span>
            <span>Запрос: {data.query}</span>
            {data.cached && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">cached</span>}
          </div>

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Ничего не найдено.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.items.map((item) => (
                <button
                  key={item.term}
                  onClick={() => void handleSearch(item.term)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="text-base font-semibold text-slate-900">{item.term}</div>
                  <div className="mt-2 text-sm text-slate-600">Релевантность: {Math.round(item.relevance * 100)}%</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
