"use client";
<<<<<<< HEAD
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
=======

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchProfile, login as apiLogin, logout as apiLogout, refreshToken, setAccessToken, type User } from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const profile = await fetchProfile();
    setUser(profile);
  };

>>>>>>> 945d7f9 (lab-1-3-and_Docker)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
<<<<<<< HEAD
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
=======
        const tokenResponse = await refreshToken();
        if (!mounted) return;
        setAccessToken(tokenResponse.access_token, true);
        const profile = await fetchProfile();
        if (mounted) setUser(profile);
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
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
<<<<<<< HEAD
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
=======
    setAccessToken(data.access_token, true);
    await refreshUser();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, isAuthenticated: Boolean(user) }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
};

export const useAuth = () => useContext(AuthContext);
