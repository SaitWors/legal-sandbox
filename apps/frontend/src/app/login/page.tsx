"use client";
<<<<<<< HEAD
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, setAccessToken } from "@/lib/api";
=======

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
>>>>>>> 945d7f9 (lab-1-3-and_Docker)

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
<<<<<<< HEAD

  async function submit(e: React.FormEvent) {
=======
  const { login } = useAuth();

  async function submit(e: FormEvent) {
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
<<<<<<< HEAD
      const data = await apiLogin(username, password);
      // API возвращает access_token — сохраняем его
      setAccessToken(data.access_token, true);
      // редирект на главную
      router.push("/");
    } catch (e: any) {
      setErr(e.message || "Ошибка логина");
=======
      await login(username, password);
      router.push("/legal/sandbox");
    } catch (error: any) {
      setErr(error?.data?.detail || error?.message || "Ошибка логина");
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    } finally {
      setLoading(false);
    }
  }

  return (
<<<<<<< HEAD
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Вход</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="p-2 border rounded"/>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="p-2 border rounded"/>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "..." : "Войти"}</button>
      </form>
=======
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl items-center px-6 py-10">
      <div className="w-full rounded-[2rem] border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Вход в рабочую область</h1>
        <p className="mt-2 text-sm text-slate-600">Используй аккаунт с ролями user, manager или admin.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="rounded-xl border p-3"/>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="rounded-xl border p-3"/>
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
          <button disabled={loading} className="rounded-xl bg-slate-950 px-4 py-3 text-white">{loading ? "Входим…" : "Войти"}</button>
        </form>
      </div>
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    </div>
  );
}
