"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { type ApiError, getErrorMessage, login as apiLogin, registerUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerUser({ username, email: email || undefined, password });
      await apiLogin(username, password);
      router.replace("/workspace");
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError, "Не удалось зарегистрироваться"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">Регистрация</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Первый пользователь становится администратором системы.</p>
        <div className="mt-6 space-y-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Логин" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <button disabled={loading} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70">
          {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Уже есть аккаунт? <Link href="/login" className="text-slate-900 underline">Войти</Link>
        </p>
      </form>
    </div>
  );
}
