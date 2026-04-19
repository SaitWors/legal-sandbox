"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/context/AuthContext";
import { type ApiError, getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.replace("/workspace");
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError, "Не удалось войти"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Вход</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Используй учётную запись, чтобы открыть рабочую область и документы.</p>
        <div className="mt-6 space-y-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Логин" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <button disabled={loading} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70">
          {loading ? "Входим…" : "Войти"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Нет аккаунта? <Link href="/register" className="text-slate-900 underline">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}
