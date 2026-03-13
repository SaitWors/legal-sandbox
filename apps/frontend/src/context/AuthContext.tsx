"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, login as apiLogin, setAccessToken } from "@/lib/api";

type TUser = { id: number; username: string; role?: string } | null;

const AuthContext = createContext({
  user: null as TUser,
  loading: true,
  login: async (u: string, p: string) => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<TUser>(null);
  const [loading, setLoading] = useState(true);

  // One-time boot: try refresh once, then fetch profile if succeeded.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!r.ok) {
          // no cookie / invalid refresh — not logged in
          if (mounted) setUser(null);
          return;
        }
        const j = await r.json();
        setAccessToken(j.access_token, true);
        // fetch profile (if endpoint exists)
        const pr = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${j.access_token}` },
        });
        if (pr.ok) {
          const profile = await pr.json();
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    // apiLogin already sets cookie via backend; it returns access_token
    setAccessToken(data.access_token, true);
    // fetch profile
    const pr = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (pr.ok) {
      setUser(await pr.json());
    } else {
      setUser(null);
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    setAccessToken(null, true);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
