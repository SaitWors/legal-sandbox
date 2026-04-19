"use client";

import { useEffect, useState } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { type ApiError, getErrorMessage, listUsers, type User, updateUserRole } from "@/lib/api";

const ROLES = ["user", "manager", "admin"] as const;

type RoleOption = (typeof ROLES)[number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await listUsers());
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError, "Не удалось загрузить пользователей"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const changeRole = async (userId: number, role: RoleOption) => {
    try {
      await updateUserRole(userId, role);
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err as ApiError, "Не удалось обновить роль"));
    }
  };

  return (
    <ProtectedRoute>
      <RoleGuard allow={["admin"]}>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-950">Управление ролями пользователей</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Страница доступна только администратору и закрыта от индексации.</p>
            {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {loading ? (
              <div className="mt-6 text-sm text-slate-500">Загрузка…</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-3 pr-4">Пользователь</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Роль</th>
                      <th className="py-3">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="py-4 pr-4 font-medium text-slate-900">{user.username}</td>
                        <td className="py-4 pr-4 text-slate-600">{user.email || "—"}</td>
                        <td className="py-4 pr-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-700">{user.role}</span>
                        </td>
                        <td className="py-4">
                          <select
                            value={user.role}
                            onChange={(event) => void changeRole(user.id, event.target.value as RoleOption)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
