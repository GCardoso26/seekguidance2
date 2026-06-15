type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Rate limit em memória por chave (IP/user) — adequado para single-instance / edge leve. */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}
