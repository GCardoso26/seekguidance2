/**
 * Shared HTTP transport for typed API clients.
 * All /api/v1 traffic must go through domain clients — never raw fetch in pages.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}

export type TokenGetter = () => string | null;
export type UnauthorizedHandler = () => void | Promise<void>;

export interface HttpClientOptions {
  baseUrl?: string;
  getAccessToken?: TokenGetter;
  onUnauthorized?: UnauthorizedHandler;
}

function resolveBaseUrl(explicit?: string): string {
  if (explicit != null && explicit !== "") return explicit.replace(/\/$/, "");
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env != null && env !== "") return env.replace(/\/$/, "");
  return "";
}

export class HttpClient {
  readonly baseUrl: string;
  private getAccessToken: TokenGetter;
  private onUnauthorized?: UnauthorizedHandler;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.baseUrl);
    this.getAccessToken = options.getAccessToken ?? (() => null);
    this.onUnauthorized = options.onUnauthorized;
  }

  setAccessTokenGetter(getter: TokenGetter): void {
    this.getAccessToken = getter;
  }

  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.onUnauthorized = handler;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      auth?: boolean;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false) {
      const token = this.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });

    if (res.status === 204) {
      return undefined as T;
    }

    const text = await res.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = { error: "invalid_json_response", raw: text };
      }
    }

    if (!res.ok) {
      const code =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : `http_${res.status}`;
      if (res.status === 401 && this.onUnauthorized) {
        await this.onUnauthorized();
      }
      throw new ApiError(res.status, code);
    }

    return payload as T;
  }

  get<T>(path: string, opts?: { auth?: boolean }): Promise<T> {
    return this.request<T>("GET", path, opts);
  }

  post<T>(path: string, body?: unknown, opts?: { auth?: boolean }): Promise<T> {
    return this.request<T>("POST", path, { body, ...opts });
  }

  patch<T>(path: string, body?: unknown, opts?: { auth?: boolean }): Promise<T> {
    return this.request<T>("PATCH", path, { body, ...opts });
  }

  delete<T>(path: string, body?: unknown, opts?: { auth?: boolean }): Promise<T> {
    return this.request<T>("DELETE", path, { body, ...opts });
  }
}

export function createHttpClient(options?: HttpClientOptions): HttpClient {
  return new HttpClient(options);
}
