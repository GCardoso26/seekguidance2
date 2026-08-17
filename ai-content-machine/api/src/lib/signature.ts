import crypto from 'node:crypto'
import { config } from '../config.js'

export function signPayload(timestamp: number | string, rawBody: string): string {
  const base = `${timestamp}.${rawBody}`
  return crypto.createHmac('sha256', config.n8nWebhookSecret).update(base).digest('hex')
}

export function verifySignature(
  signature: string,
  timestamp: number | string,
  rawBody: string,
  maxSkewSec = 300,
): { ok: boolean; reason?: string } {
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid timestamp' }
  const skew = Math.abs(Date.now() / 1000 - ts)
  if (skew > maxSkewSec) return { ok: false, reason: 'timestamp outside window' }
  const expected = signPayload(ts, rawBody)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid signature' }
  }
  return { ok: true }
}
