export const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000";

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE.replace(/\/+$/,"") + path, {
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(p: string) => req<T>(p, { method: "GET" }),
  post: <T>(p: string, body?: unknown) => req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string) => req<T>(p, { method: "DELETE" }),
  put: <T>(p: string, body?: unknown) => req<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};
