/** Base URL do backend FastAPI (Render em produção, localhost em dev). */
export const API_PROXY_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

/** Render free tier pode levar 30–60s para acordar do hibernation. */
export const API_FETCH_TIMEOUT_MS = 25_000;
const WAKE_RETRY_STATUSES = new Set([502, 503, 504]);
const WAKE_RETRY_ATTEMPTS = 3;
const WAKE_RETRY_DELAY_MS = 4_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchApiWithTimeout(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
  timeoutMs: number = API_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const { next, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_PROXY_BASE}${path}`, {
      ...fetchInit,
      signal: controller.signal,
      next,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Retry para cold start / hibernate-wake-error no Render. */
export async function fetchApiResilient(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < WAKE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetchApiWithTimeout(path, init);
      if (res.ok || !WAKE_RETRY_STATUSES.has(res.status) || attempt === WAKE_RETRY_ATTEMPTS - 1) {
        return res;
      }
      await sleep(WAKE_RETRY_DELAY_MS);
    } catch (err) {
      lastError = err;
      if (attempt === WAKE_RETRY_ATTEMPTS - 1) throw err;
      await sleep(WAKE_RETRY_DELAY_MS);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("api_unreachable");
}
