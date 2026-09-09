"use client";

/**
 * Thin fetch wrapper: JSON in/out, credentials always included so the
 * httpOnly auth cookies are sent, and a single silent-refresh retry on 401.
 */
async function request<T>(url: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  if (res.status === 401 && !isRetry && !url.includes("/api/auth/")) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (refreshed.ok) return request<T>(url, options, true);
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  get: <T,>(url: string) => request<T>(url),
  post: <T,>(url: string, body?: unknown) => request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T,>(url: string, body?: unknown) => request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(url: string) => request<T>(url, { method: "DELETE" }),
};
