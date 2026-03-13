"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
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
      // Перенаправим на страницу входа
      router.push("/login");
    } catch (e: any) {
      setErr(e.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Регистрация</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="p-2 border rounded"/>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email (не обязательно)" className="p-2 border rounded"/>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="p-2 border rounded"/>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "..." : "Зарегистрироваться"}</button>
      </form>
    </div>
  );
}
