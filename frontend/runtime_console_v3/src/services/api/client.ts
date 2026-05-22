/** Browser: sempre /api/proxy (mesmo origin). Servidor: API_PROXY_TARGET. */
const BROWSER_PROXY = "/api/proxy";

function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `${BROWSER_PROXY}${normalized}`;
  }
  const base = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
  return `${base}${normalized}`;
}

export type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  apiKey?: string | null;
  tenantId?: string | null;
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
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.apiKey) headers["X-API-Key"] = opts.apiKey;
  if (opts.tenantId) headers["X-Tenant-Id"] = opts.tenantId;

  const url = resolveApiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
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
