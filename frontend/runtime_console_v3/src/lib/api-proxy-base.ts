/** Base URL do backend FastAPI (Render em produção, localhost em dev). */
export const API_PROXY_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

/** Vercel Hobby: funções serverless ~10s. Budget total para retries. */
export const API_FETCH_TIMEOUT_MS = 7_000;
export const SERVERLESS_BUDGET_MS = 9_000;
const WAKE_RETRY_STATUSES = new Set([502, 503, 504]);
const WAKE_RETRY_DELAY_MS = 1_200;

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

/** Retry dentro do budget serverless (evita 503 por timeout da função Vercel). */
export async function fetchApiResilient(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  const deadline = Date.now() + SERVERLESS_BUDGET_MS;
  let lastError: unknown;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining < 1_500) break;

    const timeoutMs = Math.min(API_FETCH_TIMEOUT_MS, remaining - 200);
    try {
      const res = await fetchApiWithTimeout(path, init, timeoutMs);
      if (res.ok || !WAKE_RETRY_STATUSES.has(res.status)) {
        return res;
      }
      lastResponse = res;
    } catch (err) {
      lastError = err;
    }

    if (attempt < 2 && deadline - Date.now() > WAKE_RETRY_DELAY_MS + 1_000) {
      await sleep(WAKE_RETRY_DELAY_MS);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error("api_unreachable");
}
