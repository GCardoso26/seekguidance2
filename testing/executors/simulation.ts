/**
 * Simulation Layer — replay determinístico de carga funcional.
 * Sem IA. Sem LLM. Só contadores e analytics esperado.
 *
 * Ex.: 50 sellers → 100 buyers → 1000 searches → 300 add-to-cart → assert analytics
 */

export type SimulationPlan = {
  id: string;
  label: string;
  sellers: number;
  buyers: number;
  searches: number;
  addToCart: number;
  checkouts: number;
  /** Analytics esperado (isolado de Beta/LPC) */
  expectedAnalytics: {
    searchEvents: number;
    cartEvents: number;
    checkoutEvents: number;
    listingViews: number;
  };
};

export const DEFAULT_SIMULATION: SimulationPlan = {
  id: "sim-scale-smoke",
  label: "Scale smoke (deterministic)",
  sellers: 50,
  buyers: 100,
  searches: 1000,
  addToCart: 300,
  checkouts: 50,
  expectedAnalytics: {
    searchEvents: 1000,
    cartEvents: 300,
    checkoutEvents: 50,
    listingViews: 1000,
  },
};

export type SimulationResult = {
  planId: string;
  ok: boolean;
  actual: SimulationPlan["expectedAnalytics"];
  deltas: Record<string, number>;
};

/**
 * Executa replay em memória (sem HTTP/DB).
 * Substitui-se depois por executor Playwright/API em ci.
 */
export function runDeterministicSimulation(plan: SimulationPlan = DEFAULT_SIMULATION): SimulationResult {
  const actual = {
    searchEvents: plan.searches,
    cartEvents: plan.addToCart,
    checkoutEvents: plan.checkouts,
    listingViews: plan.searches,
  };
  const deltas: Record<string, number> = {};
  let ok = true;
  for (const key of Object.keys(plan.expectedAnalytics) as Array<keyof typeof actual>) {
    const d = actual[key] - plan.expectedAnalytics[key];
    deltas[key] = d;
    if (d !== 0) ok = false;
  }
  return { planId: plan.id, ok, actual, deltas };
}
