"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSearch, ShieldCheck, Sparkles } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

function navClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
    : "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const isPublicPage = pathname.startsWith("/legal") && pathname !== "/legal/sandbox";
  const isWorkspace = pathname.startsWith("/workspace") || pathname.startsWith("/legal/sandbox");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Contract Workspace</div>
            <div className="text-xs text-slate-500">Проверка договоров и контроль документов</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navClass(pathname === "/")}>Главная</Link>
          <Link href="/legal" className={navClass(isPublicPage)}>О продукте</Link>
          <Link href="/workspace" className={navClass(isWorkspace)}>Рабочая область</Link>
          {user?.role === "admin" && (
            <Link href="/admin/users" className={navClass(pathname.startsWith("/admin/users"))}>Пользователи</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Проверяем сессию…</span>
          ) : user ? (
            <>
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:flex sm:items-center sm:gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>{user.username}</span>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] uppercase tracking-wide text-slate-500">{user.role}</span>
              </div>
              <button
                onClick={() => void logout()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Войти
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                <Sparkles className="h-4 w-4" /> Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
