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

/**
 * Colisão de fingerprint de variante. A corrida persistiu o resto do produto; derrubar
 * o exit code por causa de uma variante não recuperada esconde o que de fato entrou.
 */
export function isVariantConflictSoftError(error: string): boolean {
  const e = error.trim();
  if (e.startsWith("variant:")) return true;
  return e.includes("uq_product_variant_fingerprint");
}

export function isSoftProductCatalogSyncError(error: string): boolean {
  return (
    isImageOrKnowledgeSoftError(error) ||
    isTransientUpstreamSyncError(error) ||
    isVariantConflictSoftError(error)
  );
}

export function partitionProductCatalogSyncErrors(errors: string[]): {
  soft: string[];
  hard: string[];
  transient: string[];
  imageKnowledge: string[];
  variantConflicts: string[];
} {
  const soft: string[] = [];
  const hard: string[] = [];
  const transient: string[] = [];
  const imageKnowledge: string[] = [];
  const variantConflicts: string[] = [];
  for (const e of errors) {
    if (isImageOrKnowledgeSoftError(e)) {
      soft.push(e);
      imageKnowledge.push(e);
    } else if (isTransientUpstreamSyncError(e)) {
      soft.push(e);
      transient.push(e);
    } else if (isVariantConflictSoftError(e)) {
      soft.push(e);
      variantConflicts.push(e);
    } else {
      hard.push(e);
    }
  }
  return { soft, hard, transient, imageKnowledge, variantConflicts };
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
