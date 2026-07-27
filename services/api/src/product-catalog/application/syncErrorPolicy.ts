/**
 * Soft sync errors must not fail the overall multi-provider job exit code
 * when other providers succeeded (Render cron / BullMQ ACK).
 *
 * Provider-level run is still marked failed for scheduler / ops visibility
 * when the soft error is an upstream HTTP flake (not image:/knowledge:).
 */

export function isImageOrKnowledgeSoftError(error: string): boolean {
  const e = error.trim();
  return e.startsWith("image:") || e.startsWith("knowledge:");
}

/** Transient upstream API flakes (429 / 5xx). */
export function isTransientUpstreamSyncError(error: string): boolean {
  const e = error.trim();
  if (/_http_(429|5\d\d)(?:[:|]|$)/.test(e)) return true;
  if (/^lorcana_http_(429|5\d\d):/.test(e)) return true;
  return false;
}

export function isSoftProductCatalogSyncError(error: string): boolean {
  return isImageOrKnowledgeSoftError(error) || isTransientUpstreamSyncError(error);
}

export function partitionProductCatalogSyncErrors(errors: string[]): {
  soft: string[];
  hard: string[];
  transient: string[];
  imageKnowledge: string[];
} {
  const soft: string[] = [];
  const hard: string[] = [];
  const transient: string[] = [];
  const imageKnowledge: string[] = [];
  for (const e of errors) {
    if (isImageOrKnowledgeSoftError(e)) {
      soft.push(e);
      imageKnowledge.push(e);
    } else if (isTransientUpstreamSyncError(e)) {
      soft.push(e);
      transient.push(e);
    } else {
      hard.push(e);
    }
  }
  return { soft, hard, transient, imageKnowledge };
}

/**
 * Job-level success for multi-provider sync:
 * - hard errors → fail
 * - soft-only with at least one upsert → degraded success (exit 0)
 * - soft-only with zero upserts → fail (nothing landed)
 * - no errors → success
 */
export function productCatalogSyncJobOk(upserted: number, errors: string[]): boolean {
  const { hard, soft } = partitionProductCatalogSyncErrors(errors);
  if (hard.length > 0) return false;
  if (soft.length > 0 && upserted <= 0) return false;
  return true;
}
