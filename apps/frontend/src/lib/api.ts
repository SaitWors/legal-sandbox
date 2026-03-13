// src/lib/api.ts
/* Central API utilities:
 - token management (in-memory + sessionStorage)
 - safe fetch wrapper with timeout, Authorization header, refresh-on-401
 - concrete API methods: auth (login/logout/refresh), profile, documents CRUD
*/

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1";

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
  created_at?: string;
}

export interface Document {
  id: number;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
  user_id?: number;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

// -----------------------------
// Token storage (in-memory + sessionStorage)
// -----------------------------
let accessToken: string | null = null;

export function setAccessToken(token: string | null, persist = false): void {
  accessToken = token;
  if (persist) {
    try {
      if (token) sessionStorage.setItem("ls_access_token", token);
      else sessionStorage.removeItem("ls_access_token");
    } catch (e) {
      // ignore storage errors
      // console.warn("sessionStorage set failed", e);
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function loadAccessTokenFromStorage(): void {
  try {
    const t = sessionStorage.getItem("ls_access_token");
    if (t) accessToken = t;
  } catch (e) {
    // ignore
  }
}

export function clearAccessToken(): void {
  accessToken = null;
  try {
    sessionStorage.removeItem("ls_access_token");
  } catch (e) {
    // ignore
  }
}

// load on module init
loadAccessTokenFromStorage();

// -----------------------------
// Errors helper
// -----------------------------
function createApiError(message: string, status?: number, data?: any): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.data = data;
  return err;
}

// -----------------------------
// Login / Refresh / Logout
// -----------------------------
let refreshPromise: Promise<LoginResponse> | null = null;
let isRefreshing = false;

export async function login(username: string, password: string): Promise<LoginResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let data;
      try { data = await res.json(); } catch { data = await res.text(); }
      throw createApiError(`Login failed: ${res.status}`, res.status, data);
    }

    const json = (await res.json()) as LoginResponse;
    setAccessToken(json.access_token, true);
    return json;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") throw createApiError("Login request timed out");
    throw err;
  }
}

export async function logout(): Promise<void> {
  // call backend to drop refresh cookie
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);
  } catch (err) {
    // ignore network errors for logout - we still clear token
  } finally {
    clearAccessToken();
  }
}

export async function refreshToken(): Promise<LoginResponse> {
  // already refreshing -> return same promise
  if (refreshPromise) return refreshPromise;

  if (isRefreshing) {
    // wait briefly if race
    while (isRefreshing) {
      // small backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100));
    }
    if (refreshPromise) return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async (): Promise<LoginResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let data;
        try { data = await res.json(); } catch { data = await res.text(); }
        throw createApiError(`Refresh failed: ${res.status}`, res.status, data);
      }

      const json = (await res.json()) as LoginResponse;
      setAccessToken(json.access_token, true);
      return json;
    } catch (err: any) {
      clearTimeout(timeout);
      // clear access token on failed refresh
      clearAccessToken();
      if (err?.name === "AbortError") throw createApiError("Refresh request timed out");
      throw err;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// -----------------------------
// Fetch wrapper with auth, timeout and refresh-on-401
// -----------------------------
export async function apiFetch(input: RequestInfo, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  // Build headers from init (Headers | object | array)
  const headers = new Headers(init.headers as HeadersInit | undefined);

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // auto set content-type if body is a string
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const cfg: RequestInit = {
    ...init,
    headers,
    credentials: "include",
    signal: controller.signal,
  };

  try {
    const response = await fetch(input, cfg);
    clearTimeout(timeout);

    // try refresh on first 401
    if (response.status === 401 && attempt === 0) {
      try {
        await refreshToken();
        // retry original request once
        return apiFetch(input, init, attempt + 1);
      } catch (err) {
        // refresh failed -> propagate original 401 response
        return response;
      }
    }

    return response;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") throw createApiError("Request timed out");
    throw err;
  }
}

// -----------------------------
// JSON response handler
// -----------------------------
export async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let data;
    try { data = await response.json(); } catch { data = await response.text(); }
    throw createApiError(`Request failed: ${response.status}`, response.status, data);
  }
  try {
    return (await response.json()) as T;
  } catch (err) {
    throw createApiError("Failed to parse JSON response");
  }
}

// -----------------------------
// Concrete API methods
// -----------------------------

// profile (uses users/me endpoint — adapt if backend path differs)
export async function fetchProfile(): Promise<User> {
  const res = await apiFetch(`${API_BASE}/users/me`, { method: "GET" });
  return handleJsonResponse<User>(res);
}

// Documents CRUD: use trailing slash to avoid 307 redirects
export async function fetchDocs(): Promise<Document[]> {
  const res = await apiFetch(`${API_BASE}/documents/`, { method: "GET" });
  return handleJsonResponse<Document[]>(res);
}

export async function createDoc(payload: { title: string; text: string }): Promise<Document> {
  const res = await apiFetch(`${API_BASE}/documents/`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return handleJsonResponse<Document>(res);
}

export async function updateDoc(id: number | string, payload: Partial<{ title: string; text: string }>): Promise<Document> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return handleJsonResponse<Document>(res);
}

export async function deleteDoc(id: number | string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/documents/${id}/`, { method: "DELETE" });
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch { data = await res.text(); }
    throw createApiError(`Delete failed: ${res.status}`, res.status, data);
  }
  return;
}

// -----------------------------
// Utility: check auth (used by AuthProvider/startup)
// -----------------------------
export async function checkAuth(): Promise<boolean> {
  try {
    loadAccessTokenFromStorage();
    if (!getAccessToken()) {
      // try refresh flow if no access token in memory
      await refreshToken();
    }
    // verify profile endpoint works
    await fetchProfile();
    return true;
  } catch {
    return false;
  }
}
