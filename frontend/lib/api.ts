/**
 * Typed API fetch wrapper.
 * Automatically injects Authorization: Bearer <token> from the NextAuth session.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ApiError = {
  detail: string;
  status: number;
};

export function isApiError(err: unknown): err is ApiError {
  return (
    !!err &&
    typeof err === "object" &&
    "status" in err &&
    "detail" in err &&
    typeof (err as ApiError).status === "number"
  );
}

export function formatApiError(err: unknown, fallback = "Request failed"): string {
  if (isApiError(err)) return err.detail || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

async function readErrorDetail(res: Response): Promise<string> {
  let detail = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body?.detail)) {
      detail =
        body.detail
          .map((d: { msg?: string }) => d?.msg)
          .filter(Boolean)
          .join("; ") || detail;
    }
  } catch {
    /* ignore non-JSON bodies */
  }
  return detail;
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
    const err: ApiError = {
      detail: await readErrorDetail(res),
      status: res.status,
    };
    throw err;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export const api = {
  get: <T>(path: string, options: RequestInit & { accessToken?: string } = {}) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, options: RequestInit & { accessToken?: string } = {}) =>
    apiFetch<T>(path, { ...options, method: "POST" }),

  put: <T>(path: string, options: RequestInit & { accessToken?: string } = {}) =>
    apiFetch<T>(path, { ...options, method: "PUT" }),

  patch: <T>(path: string, options: RequestInit & { accessToken?: string } = {}) =>
    apiFetch<T>(path, { ...options, method: "PATCH" }),

  delete: <T>(path: string, options: RequestInit & { accessToken?: string } = {}) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

/**
 * Upload a file (multipart). Do not set Content-Type — browser sets boundary.
 */
export async function apiUpload<T>(
  path: string,
  file: File,
  accessToken: string,
  fieldName = "file"
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file, file.name);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err: ApiError = {
      detail: await readErrorDetail(res),
      status: res.status,
    };
    throw err;
  }

  return (await res.json()) as T;
}

/**
 * POST and return a Response for SSE streaming.
 * Throws ApiError (with status + detail) when the initial response is non-2xx.
 */
export async function apiStream(
  path: string,
  body: object,
  accessToken: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options?.headers as Record<string, string> | undefined),
    },
    body: JSON.stringify(body),
    ...options,
  });

  if (!res.ok) {
    const err: ApiError = {
      detail: await readErrorDetail(res),
      status: res.status,
    };
    throw err;
  }

  return res;
}
