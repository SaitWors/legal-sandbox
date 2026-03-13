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
  );
}
