"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: string[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !allow.includes(user.role))) {
      router.replace("/");
    }
  }, [allow, loading, router, user]);

  if (loading) {
    return <div className="p-10 text-center text-sm text-slate-500">Проверяем права доступа…</div>;
  }
  if (!user || !allow.includes(user.role)) return null;
  return <>{children}</>;
}
