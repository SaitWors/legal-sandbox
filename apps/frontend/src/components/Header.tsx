"use client";
<<<<<<< HEAD
import Link from "next/link";
import React from "react";
=======

import Link from "next/link";
import { ShieldCheck, UserCog } from "lucide-react";

>>>>>>> 945d7f9 (lab-1-3-and_Docker)
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
<<<<<<< HEAD
    <header className="w-full border-b py-3 px-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <Link href="/">
          <span className="font-bold text-lg">Legal Sandbox</span>
        </Link>
      </div>

      <div>
        {loading ? (
          <span className="text-sm text-slate-500">Loading…</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm">Hi, {user.username}</span>
            <button
              onClick={async () => { await logout(); }}
              className="px-3 py-1 rounded bg-red-50 border text-sm"
=======
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-950">
            Legal Sandbox
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <Link href="/legal/sandbox">Workspace</Link>
            {user && ["admin"].includes(user.role) && <Link href="/admin/users">Users</Link>}
          </nav>
        </div>

        {loading ? (
          <span className="text-sm text-slate-500">Загрузка…</span>
        ) : user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-slate-700">
              {user.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
              {user.username} · {user.role}
            </span>
            <button
              onClick={async () => {
                await logout();
              }}
              className="rounded-xl border px-3 py-2 text-slate-700 transition hover:bg-slate-50"
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
<<<<<<< HEAD
            <Link href="/login">
              <button className="px-3 py-1 rounded border text-sm">Войти</button>
            </Link>
            <Link href="/register">
              <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Регистрация</button>
=======
            <Link href="/login" className="rounded-xl border px-3 py-2 text-sm text-slate-700">
              Войти
            </Link>
            <Link href="/register" className="rounded-xl bg-slate-950 px-3 py-2 text-sm text-white">
              Регистрация
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
