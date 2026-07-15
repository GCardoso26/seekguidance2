/** Base URL do backend FastAPI (Render em produção, localhost em dev). */
export const API_PROXY_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

/** Vercel Hobby: funções serverless ~10s. Budget total para retries. */
export const API_FETCH_TIMEOUT_MS = 7_000;
export const SERVERLESS_BUDGET_MS = 9_800;
const WAKE_RETRY_STATUSES = new Set([502, 503, 504]);
const RATE_LIMIT_RETRY_STATUSES = new Set([429]);
const WAKE_RETRY_DELAY_MS = 600;
/** Timeouts curtos por tentativa — cabem 2–3 wake retries no budget de 10s. */
const ATTEMPT_TIMEOUTS_MS = [3_400, 4_200, 3_400] as const;
const MIN_REMAINING_FOR_ATTEMPT_MS = 800;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(res: Response, fallbackMs: number): number {
  const raw = res.headers.get("Retry-After");
  if (!raw) return fallbackMs;
  const asInt = Number(raw);
  if (Number.isFinite(asInt) && asInt >= 0) {
    return Math.min(Math.max(asInt * 1000, 400), 8_000);
  }
  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) {
    return Math.min(Math.max(asDate - Date.now(), 400), 8_000);
  }
  return fallbackMs;
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

  for (let attempt = 0; attempt < ATTEMPT_TIMEOUTS_MS.length; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_REMAINING_FOR_ATTEMPT_MS) break;

    const timeoutMs = Math.min(
      ATTEMPT_TIMEOUTS_MS[attempt] ?? API_FETCH_TIMEOUT_MS,
      remaining - 100,
    );
    try {
      const res = await fetchApiWithTimeout(path, init, timeoutMs);
      if (res.ok) return res;

      lastResponse = res;
      const shouldRetryWake = WAKE_RETRY_STATUSES.has(res.status);
      const shouldRetryRate = RATE_LIMIT_RETRY_STATUSES.has(res.status);
      if (!shouldRetryWake && !shouldRetryRate) {
        return res;
      }

      const afterAttempt = deadline - Date.now();
      const delay = shouldRetryRate
        ? retryAfterMs(res, WAKE_RETRY_DELAY_MS)
        : WAKE_RETRY_DELAY_MS;
      if (
        attempt < ATTEMPT_TIMEOUTS_MS.length - 1 &&
        afterAttempt > delay + MIN_REMAINING_FOR_ATTEMPT_MS
      ) {
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    }

    const afterAttempt = deadline - Date.now();
    if (
      attempt < ATTEMPT_TIMEOUTS_MS.length - 1 &&
      afterAttempt > WAKE_RETRY_DELAY_MS + MIN_REMAINING_FOR_ATTEMPT_MS
    ) {
      await sleep(WAKE_RETRY_DELAY_MS);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error("api_unreachable");
}
