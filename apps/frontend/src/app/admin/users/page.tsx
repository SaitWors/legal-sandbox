"use client";

import { useEffect, useState } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { fetchUsers, type User, updateUserRole } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);
      setUsers(await fetchUsers());
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <ProtectedRoute>
      <RoleGuard allow={["admin"]}>
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-[2rem] border bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Управление ролями</h1>
            <p className="mt-2 text-sm text-slate-600">Эндпоинт доступен только администратору и нужен для ЛР по RBAC.</p>
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {loading ? (
              <div className="mt-6 text-sm text-slate-500">Загрузка пользователей…</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-3 pr-4">ID</th>
                      <th className="py-3 pr-4">Пользователь</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Роль</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">#{user.id}</td>
                        <td className="py-3 pr-4">{user.username}</td>
                        <td className="py-3 pr-4">{user.email || "—"}</td>
                        <td className="py-3 pr-4">
                          <select
                            className="rounded-xl border px-3 py-2"
                            value={user.role}
                            onChange={async (event) => {
                              await updateUserRole(user.id, event.target.value as "user" | "manager" | "admin");
                              await loadUsers();
                            }}
                          >
                            <option value="user">user</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </RoleGuard>
    </ProtectedRoute>
  );
}
