/**
 * Marketplace / Identity / Search performance budgets (Sprint 4.4).
 * Regressions fail smoke:golden-path when exceeded.
 */
export const MARKETPLACE_PERFORMANCE_BUDGET = {
  loginMs: 150,
  publishListingMs: 250,
  listingToSearchMs: 5_000,
  getSearchMs: 100,
  getOffersMs: 100,
} as const;

export type MarketplaceBudgetKey = keyof typeof MARKETPLACE_PERFORMANCE_BUDGET;

export interface TimingSample {
  name: MarketplaceBudgetKey | string;
  ms: number;
  budgetMs?: number;
  ok: boolean;
}

export function checkBudget(
  name: MarketplaceBudgetKey,
  ms: number,
): TimingSample {
  const budgetMs = MARKETPLACE_PERFORMANCE_BUDGET[name];
  return { name, ms, budgetMs, ok: ms <= budgetMs };
}
