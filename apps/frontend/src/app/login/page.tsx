"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, setAccessToken } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await apiLogin(username, password);
      // API возвращает access_token — сохраняем его
      setAccessToken(data.access_token, true);
      // редирект на главную
      router.push("/");
    } catch (e: any) {
      setErr(e.message || "Ошибка логина");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Вход</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Логин" required className="p-2 border rounded"/>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Пароль" type="password" required className="p-2 border rounded"/>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? "..." : "Войти"}</button>
      </form>
    </div>
  );
}
