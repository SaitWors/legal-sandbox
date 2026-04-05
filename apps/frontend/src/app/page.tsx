<<<<<<< HEAD
// apps/frontend/src/app/page.tsx
"use client";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LegalSandbox from "@/components/legal/LegalSandbox";

function HomeContent() {
  const { user, loading } = useAuth();
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Legal Sandbox</h1>
        <div>
          {!loading && !user && (
            <div className="flex gap-2">
              <Link href="/login">
                <button className="btn">Войти</button>
              </Link>
              <Link href="/register">
                <button className="btn-outline">Регистрация</button>
              </Link>
            </div>
          )}
          {!loading && user && (
            <div className="text-sm">Привет, {user.username}</div>
          )}
        </div>
      </header>

      <main>
        <LegalSandbox />
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
=======
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="mb-4 inline-flex rounded-full border bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600 shadow-sm">
            Legal Sandbox Platform
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Анализируй договоры как продуктовая команда, а не как учебный проект.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Веб-приложение для сегментации текста, поиска дублей и конфликтов, управления версиями документов и безопасной работы через JWT-защищённый API.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legal/sandbox" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm">
              Открыть рабочую область
            </Link>
            <Link href="/login" className="rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
              Войти
            </Link>
            <Link href="/register" className="rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
              Создать аккаунт
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">UI/UX</div>
              <p className="mt-2 text-sm text-slate-600">Готовый адаптивный интерфейс, вкладки, карточки пунктов и экспорт отчётов.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Backend</div>
              <p className="mt-2 text-sm text-slate-600">FastAPI, SQLite, CRUD для документов, сегментация и анализ через API.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Security</div>
              <p className="mt-2 text-sm text-slate-600">JWT access token, refresh cookie и защита приватных эндпоинтов.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Integration</div>
              <p className="mt-2 text-sm text-slate-600">Фронтенд работает с сервером, но умеет безопасно откатиться на локальный режим.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
  );
}
