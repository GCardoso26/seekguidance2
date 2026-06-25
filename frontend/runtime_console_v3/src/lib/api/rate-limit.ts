type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/** Rate limit em memória por chave (IP/user) — adequado para single-instance / edge leve. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${key}:${windowStart}`;
  const current = buckets.get(bucketKey)?.count ?? 0;

  if (current >= limit) {
    return { success: false, limit, remaining: 0, reset: windowStart + windowMs };
  }

  buckets.set(bucketKey, { count: current + 1, resetAt: windowStart + windowMs });
  return { success: true, limit, remaining: limit - current - 1, reset: windowStart + windowMs };
}

/** @deprecated Use rateLimit() — mantido para rotas existentes */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  return rateLimit(key, max, windowMs).success;
}

export function clientIpFromHeaders(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "anonymous";
}
