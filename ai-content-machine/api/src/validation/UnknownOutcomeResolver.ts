/**
 * Phase 5.1 — UNKNOWN uploads must never auto-retry blindly.
 * Decision only; caller performs getPublication / manual retry.
 */
export type UnknownDecision =
  | { action: 'MARK_PUBLISHED'; reason: 'remote_exists' }
  | { action: 'RETRY'; reason: 'remote_missing_safe_to_retry' }
  | { action: 'HOLD'; reason: 'await_manual_review' | 'insufficient_signal' }

export function resolveUnknownOutcome(input: {
  remoteFound: boolean
  remoteStatus?: string | null
  attempts?: number
  autoRetryEnabled?: boolean
}): UnknownDecision {
  if (input.remoteFound) {
    return { action: 'MARK_PUBLISHED', reason: 'remote_exists' }
  }
  // Phase 5.1: never auto-retry UNKNOWN
  if (input.autoRetryEnabled === true) {
    return { action: 'RETRY', reason: 'remote_missing_safe_to_retry' }
  }
  return { action: 'HOLD', reason: 'await_manual_review' }
}
