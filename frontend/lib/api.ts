/**
 * Typed API fetch wrapper.
 * Automatically injects Authorization: Bearer <token> from the NextAuth session.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiError {
  detail: string;
  status: number;
}

/**
 * Fetch from the FastAPI backend with auth token injected.
 * Throws ApiError on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    const err: ApiError = { detail, status: res.status };
    throw err;
  }

  // Some endpoints return empty body
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

/** Convenience: stream SSE response from a POST endpoint. */
export async function apiStream(
  path: string,
  body: object,
  accessToken: string
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}
