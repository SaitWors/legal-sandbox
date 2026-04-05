"use client";
<<<<<<< HEAD
import React, { useState } from "react";
import { useRouter } from "next/navigation";
=======

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

>>>>>>> 73dd6ff (С 1й по 3ю и docker)
import { API_BASE } from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

<<<<<<< HEAD
  async function submit(e: React.FormEvent) {
=======
  async function submit(e: FormEvent) {
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: email || undefined, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.detail || `Ошибка ${res.status}`);
      }
<<<<<<< HEAD
      // Перенаправим на страницу входа
      router.push("/login");
    } catch (e: any) {
      setErr(e.message || "Ошибка регистрации");
=======
      router.push("/login");
    } catch (error: any) {
      setErr(error?.message || "Ошибка регистрации");
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    } finally {
      setLoading(false);
    }
  }

  return (
<<<<<<< HEAD
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Регистрация</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="p-2 border rounded"/>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email (не обязательно)" className="p-2 border rounded"/>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="p-2 border rounded"/>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "..." : "Зарегистрироваться"}</button>
      </form>
=======
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl items-center px-6 py-10">
      <div className="w-full rounded-[2rem] border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Создать аккаунт</h1>
        <p className="mt-2 text-sm text-slate-600">Первый зарегистрированный пользователь автоматически станет admin.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="rounded-xl border p-3"/>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="rounded-xl border p-3"/>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="rounded-xl border p-3"/>
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
          <button disabled={loading} className="rounded-xl bg-slate-950 px-4 py-3 text-white">{loading ? "Создаём…" : "Зарегистрироваться"}</button>
        </form>
      </div>
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
    </div>
  );
}
