/**
 * Shared fetch with bounded retries for upstream catalog APIs (429 / 5xx).
 */
export async function fetchWithTransientRetry(
  url: string,
  init: RequestInit,
  opts: { attempts?: number; baseDelayMs?: number; retryOnStatuses?: number[] } = {},
): Promise<Response> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const retryOn = new Set(opts.retryOnStatuses ?? [429, 500, 502, 503, 504]);

  let last: Response | undefined;
  for (let i = 0; i < attempts; i++) {
    last = await fetch(url, init);
    if (last.ok || !retryOn.has(last.status) || i === attempts - 1) {
      return last;
    }
    const retryAfter = Number(last.headers.get("retry-after"));
    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : baseDelayMs * 2 ** i;
    await new Promise((r) => setTimeout(r, delay));
  }
  return last!;
}
