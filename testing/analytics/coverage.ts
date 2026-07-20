/**
 * KPIs internos de engenharia de testes (não são North Star de produto).
 *
 * TCS = Fluxos Automatizados / Fluxos Definidos
 * PCS = Personas Exercitadas / Personas Existentes
 */

export type CoverageScore = {
  name: "TCS" | "PCS" | "FCS";
  numerator: number;
  denominator: number;
  score: number;
  percent: string;
};

export function computeTCS(automatedFlows: number, definedFlows: number): CoverageScore {
  const score = definedFlows === 0 ? 0 : automatedFlows / definedFlows;
  return {
    name: "TCS",
    numerator: automatedFlows,
    denominator: definedFlows,
    score,
    percent: `${(score * 100).toFixed(1)}%`,
  };
}

export function computePCS(exercisedPersonas: number, existingPersonas: number): CoverageScore {
  const score = existingPersonas === 0 ? 0 : exercisedPersonas / existingPersonas;
  return {
    name: "PCS",
    numerator: exercisedPersonas,
    denominator: existingPersonas,
    score,
    percent: `${(score * 100).toFixed(1)}%`,
  };
}

/** Fluxos definidos na arquitetura (seller/buyer/admin/smoke). */
export const DEFINED_FLOWS = [
  "seller.login",
  "seller.createListing",
  "seller.editListing",
  "seller.updateStock",
  "seller.removeListing",
  "buyer.search",
  "buyer.pdp",
  "buyer.offer",
  "buyer.cart",
  "buyer.checkoutSession",
  "admin.login",
  "admin.dashboard",
  "admin.moderate",
  "admin.orders",
  "smoke.health",
  "smoke.search",
  "smoke.pdp",
] as const;

/** Baseline atual (lifecycle + smoke) — atualizar conforme a suíte cresce. */
export const AUTOMATED_FLOWS_BASELINE = [
  "seller.login",
  "seller.createListing",
  "seller.editListing",
  "seller.updateStock",
  "buyer.search",
  "buyer.pdp",
  "buyer.cart",
  "buyer.checkoutSession",
  "smoke.health",
  "smoke.search",
  "smoke.pdp",
] as const;
