"use client";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
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
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="px-3 py-1 rounded border text-sm">Войти</button>
            </Link>
            <Link href="/register">
              <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Регистрация</button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
