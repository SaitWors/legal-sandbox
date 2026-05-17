import { Clause, Finding } from "@/lib/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/v1";

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: "user" | "manager" | "admin" | string;
  created_at?: string;
}

export interface Document {
  id: number;
  title: string;
  text: string;
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
}

export interface ExternalTermInsight {
  term: string;
  relevance: number;
  tags: string[];
}

export interface ExternalTermsResponse {
  source: string;
  query: string;
  items: ExternalTermInsight[];
  cached: boolean;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export function getErrorMessage(error: ApiError | unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const typed = error as ApiError;
  if (typed.data && typeof typed.data === "object" && "detail" in typed.data) {
    const detail = (typed.data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  if (typeof typed.message === "string" && typed.message.trim()) return typed.message;
  return fallback;
}

let accessToken: string | null = null;
let refreshPromise: Promise<LoginResponse> | null = null;

export function setAccessToken(token: string | null, persist = false): void {
  accessToken = token;
  if (typeof window === "undefined") return;
  try {
    if (persist) {
      if (token) sessionStorage.setItem("ls_access_token", token);
      else sessionStorage.removeItem("ls_access_token");
    }
  } catch {}
}

function loadAccessTokenFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const token = sessionStorage.getItem("ls_access_token");
    if (token) accessToken = token;
  } catch {}
}

loadAccessTokenFromStorage();

function createApiError(message: string, status?: number, data?: unknown): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.data = data;
  return err;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw createApiError(`API error: ${response.status}`, response.status, data);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { retryAuth?: boolean; skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && options.retryAuth !== false && !options.skipAuthRefresh) {
    try {
      const refreshed = await refreshToken();
      setAccessToken(refreshed.access_token, true);
      return request<T>(path, init, { retryAuth: false, skipAuthRefresh: true });
    } catch {
      clearAccessToken();
      throw createApiError("Session expired", 401);
    }
  }

  return parseResponse<T>(response);
}

export function clearAccessToken(): void {
  accessToken = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("ls_access_token");
  } catch {}
}

export async function registerUser(payload: { username: string; email?: string; password: string }): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, { retryAuth: false, skipAuthRefresh: true });
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }, { retryAuth: false, skipAuthRefresh: true });
  setAccessToken(response.access_token, true);
  return response;
}

export async function refreshToken(): Promise<LoginResponse> {
  if (!refreshPromise) {
    refreshPromise = request<LoginResponse>("/auth/refresh", { method: "POST" }, { retryAuth: false, skipAuthRefresh: true }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" }, { retryAuth: false, skipAuthRefresh: true });
  } finally {
    clearAccessToken();
  }
}

export async function fetchProfile(): Promise<User> {
  return request<User>("/auth/me");
}

export async function listUsers(): Promise<User[]> {
  return request<User[]>("/users/");
}

export async function updateUserRole(userId: number, role: "user" | "manager" | "admin"): Promise<User> {
  return request<User>(`/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export async function fetchDocs(filters: Record<string, string | number | undefined> = {}): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return request<DocumentListResponse>(`/documents/?${params.toString()}`);
}

export async function createDoc(payload: { title: string; text: string; category: string; status: string }): Promise<Document> {
  return request<Document>("/documents/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateDoc(docId: number, payload: Partial<Pick<Document, "title" | "text" | "category" | "status">>): Promise<Document> {
  return request<Document>(`/documents/${docId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteDoc(docId: number): Promise<void> {
  return request<void>(`/documents/${docId}`, { method: "DELETE" });
}

export async function fetchFiles(documentId: number): Promise<Attachment[]> {
  const response = await request<{ items: Attachment[] }>(`/files/documents/${documentId}`);
  return response.items;
}

export async function uploadFile(documentId: number, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file);
  return request<Attachment>(`/files/documents/${documentId}`, {
    method: "POST",
    body: form,
  });
}

export async function getFileLink(fileId: number): Promise<{ url: string; expires_in: number }> {
  return request<{ url: string; expires_in: number }>(`/files/${fileId}/link`);
}

export async function deleteFile(fileId: number): Promise<void> {
  return request<void>(`/files/${fileId}`, { method: "DELETE" });
}

export async function segmentText(text: string): Promise<{ clauses: Clause[]; parts: string[] }> {
  return request<{ clauses: Clause[]; parts: string[] }>("/segment/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }, { retryAuth: false, skipAuthRefresh: true });
}

export async function analyzeText(text: string, dupThreshold: number): Promise<{ clauses: Clause[]; findings: Finding[]; dup_threshold: number }> {
  return request<{ clauses: Clause[]; findings: Finding[]; dup_threshold: number }>("/analyze/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, dup_threshold: dupThreshold }),
  }, { retryAuth: false, skipAuthRefresh: true });
}

export async function fetchTermInsights(term: string): Promise<ExternalTermsResponse> {
  return request<ExternalTermsResponse>(`/external/terms?term=${encodeURIComponent(term)}`, {}, { retryAuth: false, skipAuthRefresh: true });
}
