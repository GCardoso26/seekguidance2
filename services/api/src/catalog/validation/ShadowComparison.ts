/**
 * SHADOW comparison report — objective gate before CANARY.
 * @see FOUNDATION_FREEZE §14.3
 */
export interface ShadowComparisonExpected {
  setsSyncedPct: number;
  cardsSyncedPct: number;
  variantsSyncedPct: number;
  providerMappingsPct: number;
  /** Outbox events should equal created+updated outcomes (not unchanged). */
  outboxEventsMatchUpdates: boolean;
  /** After first full sync, no-op rate should be high on re-run. */
  minNoopRateAfterFirstSync: number;
  maxDivergences: number;
}

export const DEFAULT_SHADOW_EXPECTED: ShadowComparisonExpected = {
  setsSyncedPct: 100,
  cardsSyncedPct: 100,
  variantsSyncedPct: 100,
  providerMappingsPct: 100,
  outboxEventsMatchUpdates: true,
  minNoopRateAfterFirstSync: 0.95,
  maxDivergences: 0,
};

export interface ShadowComparisonActual {
  setsSyncedPct: number;
  cardsSyncedPct: number;
  variantsSyncedPct: number;
  providerMappingsPct: number;
  outboxInserts: number;
  domainUpdates: number;
  noopRate: number;
  divergences: ShadowDivergence[];
}

export interface ShadowDivergence {
  kind:
    | "missing_set"
    | "missing_card"
    | "missing_variant"
    | "missing_mapping"
    | "orphan_mapping"
    | "outbox_mismatch"
    | "other";
  message: string;
  aggregateId?: string;
}

export interface ShadowComparisonResult {
  passed: boolean;
  expected: ShadowComparisonExpected;
  actual: ShadowComparisonActual;
  failures: string[];
}

export function evaluateShadowComparison(
  actual: ShadowComparisonActual,
  expected: ShadowComparisonExpected = DEFAULT_SHADOW_EXPECTED,
): ShadowComparisonResult {
  const failures: string[] = [];
  if (actual.setsSyncedPct < expected.setsSyncedPct) {
    failures.push(`sets_synced ${actual.setsSyncedPct}% < ${expected.setsSyncedPct}%`);
  }
  if (actual.cardsSyncedPct < expected.cardsSyncedPct) {
    failures.push(`cards_synced ${actual.cardsSyncedPct}% < ${expected.cardsSyncedPct}%`);
  }
  if (actual.variantsSyncedPct < expected.variantsSyncedPct) {
    failures.push(`variants_synced ${actual.variantsSyncedPct}% < ${expected.variantsSyncedPct}%`);
  }
  if (actual.providerMappingsPct < expected.providerMappingsPct) {
    failures.push(
      `provider_mappings ${actual.providerMappingsPct}% < ${expected.providerMappingsPct}%`,
    );
  }
  if (expected.outboxEventsMatchUpdates && actual.outboxInserts !== actual.domainUpdates) {
    failures.push(
      `outbox_mismatch inserts=${actual.outboxInserts} updates=${actual.domainUpdates}`,
    );
  }
  if (actual.noopRate < expected.minNoopRateAfterFirstSync) {
    failures.push(
      `noop_rate ${actual.noopRate} < ${expected.minNoopRateAfterFirstSync}`,
    );
  }
  if (actual.divergences.length > expected.maxDivergences) {
    failures.push(`divergences ${actual.divergences.length} > ${expected.maxDivergences}`);
  }
  return { passed: failures.length === 0, expected, actual, failures };
}
