/** Browser: /api/bff (cookies HttpOnly) ou /api/proxy (público). Servidor: API_PROXY_TARGET. */

const BROWSER_PROXY = "/api/proxy";
const BROWSER_BFF = "/api/bff";

export function resolveApiUrl(path: string, opts?: { publicRoute?: boolean }): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const isPublic =
    opts?.publicRoute ||
    path.startsWith("/runtime/judge") ||
    path === "/v1/health" ||
    path === "/health";

  if (typeof window !== "undefined") {
    return `${isPublic ? BROWSER_PROXY : BROWSER_BFF}${normalized}`;
  }

  const base = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
  return `${base}${normalized}`;
}

export type RequestOptions = {
  method?: string;
  body?: unknown;
  publicRoute?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const url = resolveApiUrl(path, { publicRoute: opts.publicRoute });
  const useCredentials = url.startsWith(BROWSER_BFF);

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      credentials: useCredentials ? "include" : "same-origin",
    });
  } catch (e) {
    throw new ApiError("Network error — API unreachable", 0, e);
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(`API ${res.status}`, res.status, data);
  }
  return data as T;
}
