<<<<<<< HEAD
// src/lib/api.ts
/* Central API utilities:
 - token management (in-memory + sessionStorage)
 - safe fetch wrapper with timeout, Authorization header, refresh-on-401
 - concrete API methods: auth (login/logout/refresh), profile, documents CRUD
*/

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1";
=======
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/v1";
>>>>>>> 945d7f9 (lab-1-3-and_Docker)

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
<<<<<<< HEAD
  role?: string;
=======
  role: "user" | "manager" | "admin" | string;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
  created_at?: string;
}

export interface Document {
  id: number;
  title: string;
  text: string;
<<<<<<< HEAD
  created_at: string;
  updated_at: string;
  user_id?: number;
=======
  category: string;
  status: "draft" | "review" | "approved" | "archived" | string;
  created_at: string;
  updated_at: string;
  owner_id: number;
}

export interface DocumentListResponse {
  items: Document[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

export interface Attachment {
  id: number;
  document_id: number;
  owner_id: number;
  original_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

<<<<<<< HEAD
// -----------------------------
// Token storage (in-memory + sessionStorage)
// -----------------------------
=======
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
let accessToken: string | null = null;

export function setAccessToken(token: string | null, persist = false): void {
  accessToken = token;
  if (persist) {
    try {
      if (token) sessionStorage.setItem("ls_access_token", token);
      else sessionStorage.removeItem("ls_access_token");
<<<<<<< HEAD
    } catch (e) {
      // ignore storage errors
      // console.warn("sessionStorage set failed", e);
    }
=======
    } catch {}
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function loadAccessTokenFromStorage(): void {
  try {
<<<<<<< HEAD
    const t = sessionStorage.getItem("ls_access_token");
    if (t) accessToken = t;
  } catch (e) {
    // ignore
  }
=======
    const token = sessionStorage.getItem("ls_access_token");
    if (token) accessToken = token;
  } catch {}
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
}

export function clearAccessToken(): void {
  accessToken = null;
  try {
    sessionStorage.removeItem("ls_access_token");
<<<<<<< HEAD
  } catch (e) {
    // ignore
  }
}

// load on module init
loadAccessTokenFromStorage();

// -----------------------------
// Errors helper
// -----------------------------
=======
  } catch {}
}

loadAccessTokenFromStorage();

>>>>>>> 945d7f9 (lab-1-3-and_Docker)
function createApiError(message: string, status?: number, data?: any): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.data = data;
  return err;
}

<<<<<<< HEAD
// -----------------------------
// Login / Refresh / Logout
// -----------------------------
=======
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
let refreshPromise: Promise<LoginResponse> | null = null;
let isRefreshing = false;

export async function login(username: string, password: string): Promise<LoginResponse> {
<<<<<<< HEAD
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
=======
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw createApiError(`Login failed: ${response.status}`, response.status, data);
  }

  const json = (await response.json()) as LoginResponse;
  setAccessToken(json.access_token, true);
  return json;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
  } finally {
    clearAccessToken();
  }
}

export async function refreshToken(): Promise<LoginResponse> {
<<<<<<< HEAD
  // already refreshing -> return same promise
  if (refreshPromise) return refreshPromise;

  if (isRefreshing) {
    // wait briefly if race
    while (isRefreshing) {
      // small backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100));
=======
  if (refreshPromise) return refreshPromise;
  if (isRefreshing) {
    while (isRefreshing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    }
    if (refreshPromise) return refreshPromise;
  }

  isRefreshing = true;
<<<<<<< HEAD
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
=======
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
        throw createApiError(`Refresh failed: ${response.status}`, response.status, data);
      }

      const json = (await response.json()) as LoginResponse;
      setAccessToken(json.access_token, true);
      return json;
    } catch (error) {
      clearAccessToken();
      throw error;
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

<<<<<<< HEAD
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
=======
export async function apiFetch(input: RequestInfo, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit | undefined);
  const token = getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && attempt === 0) {
    try {
      await refreshToken();
      return apiFetch(input, init, attempt + 1);
    } catch {
      return response;
    }
  }

  return response;
}

export async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw createApiError(`Request failed: ${response.status}`, response.status, data);
  }
  return (await response.json()) as T;
}

export async function fetchProfile(): Promise<User> {
  const response = await apiFetch(`${API_BASE}/auth/me`, { method: "GET" });
  return handleJsonResponse<User>(response);
}

export async function fetchDocs(query: Record<string, string | number | undefined> = {}): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const response = await apiFetch(`${API_BASE}/documents/?${params.toString()}`, { method: "GET" });
  return handleJsonResponse<DocumentListResponse>(response);
}

export async function fetchDoc(id: number | string): Promise<Document> {
  const response = await apiFetch(`${API_BASE}/documents/${id}`, { method: "GET" });
  return handleJsonResponse<Document>(response);
}

export async function createDoc(payload: {
  title: string;
  text: string;
  category: string;
  status: string;
}): Promise<Document> {
  const response = await apiFetch(`${API_BASE}/documents/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Document>(response);
}

export async function updateDoc(
  id: number | string,
  payload: Partial<{ title: string; text: string; category: string; status: string }>,
): Promise<Document> {
  const response = await apiFetch(`${API_BASE}/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Document>(response);
}

export async function deleteDoc(id: number | string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/documents/${id}`, { method: "DELETE" });
  if (!response.ok) throw createApiError(`Delete failed: ${response.status}`, response.status);
}

export async function analyzeText(payload: { text: string; dup_threshold: number }) {
  const response = await apiFetch(`${API_BASE}/analyze/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<{ clauses: any[]; findings: any[]; dup_threshold: number }>(response);
}

export async function segmentText(payload: { text: string }) {
  const response = await apiFetch(`${API_BASE}/segment/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<{ clauses: any[]; parts: string[] }>(response);
}

export async function fetchUsers(): Promise<User[]> {
  const response = await apiFetch(`${API_BASE}/users/`, { method: "GET" });
  return handleJsonResponse<User[]>(response);
}

export async function updateUserRole(userId: number, role: "user" | "manager" | "admin"): Promise<User> {
  const response = await apiFetch(`${API_BASE}/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return handleJsonResponse<User>(response);
}

export async function fetchFiles(documentId: number): Promise<Attachment[]> {
  const response = await apiFetch(`${API_BASE}/files/documents/${documentId}`, { method: "GET" });
  const data = await handleJsonResponse<{ items: Attachment[] }>(response);
  return data.items;
}

export async function uploadFile(documentId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`${API_BASE}/files/documents/${documentId}`, {
    method: "POST",
    body: formData,
  });
  return handleJsonResponse<Attachment>(response);
}

export async function getFileLink(fileId: number): Promise<{ url: string; expires_in: number }> {
  const response = await apiFetch(`${API_BASE}/files/${fileId}/link`, { method: "GET" });
  return handleJsonResponse<{ url: string; expires_in: number }>(response);
}

export async function deleteFile(fileId: number): Promise<void> {
  const response = await apiFetch(`${API_BASE}/files/${fileId}`, { method: "DELETE" });
  if (!response.ok) throw createApiError(`Delete failed: ${response.status}`, response.status);
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
}
