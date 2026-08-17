export type RetryOptions = {
  maxAttempts?: number
  delaysMs?: number[]
  label?: string
}

export type RetryFailure = {
  attempts: number
  error: string
}

/**
 * Exponential-ish backoff with fixed schedule (30s, 2m, 10m) compressed for tests via env.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions = {},
): Promise<{ ok: true; value: T; attempts: number } | { ok: false; failure: RetryFailure }> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelays = opts.delaysMs ?? [30_000, 120_000, 600_000]
  const fast = process.env.CWM_FAST_RETRY === '1'
  const delays = fast ? [0, 0, 0] : baseDelays

  let lastError = 'unknown'
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const value = await fn(attempt)
      return { ok: true, value, attempts: attempt }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : ''
      if (code === 'AWAITING_USER' || code === 'NO_RETRY') {
        return { ok: false, failure: { attempts: attempt, error: lastError } }
      }
      if (attempt < maxAttempts) {
        const wait = delays[Math.min(attempt - 1, delays.length - 1)] ?? 0
        if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      }
    }
  }
  return { ok: false, failure: { attempts: maxAttempts, error: lastError } }
}
