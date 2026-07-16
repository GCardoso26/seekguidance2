/**
 * Checkout API performance budgets (Sprint 5.4).
 * @see docs/architecture/CHECKOUT_API_CONTRACT.md
 */
export const CHECKOUT_PERFORMANCE_BUDGET = {
  createCartMs: 100,
  addItemMs: 150,
  checkoutStartMs: 200,
  payFakeMs: 500,
  getOrderMs: 100,
} as const;

export type CheckoutBudgetKey = keyof typeof CHECKOUT_PERFORMANCE_BUDGET;

export function checkCheckoutBudget(
  name: CheckoutBudgetKey,
  ms: number,
): { name: CheckoutBudgetKey; ms: number; budgetMs: number; ok: boolean } {
  const budgetMs = CHECKOUT_PERFORMANCE_BUDGET[name];
  return { name, ms, budgetMs, ok: ms <= budgetMs };
}
