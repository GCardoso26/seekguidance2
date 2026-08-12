export type SellerPlanId = "lojista" | "pro" | "enterprise" | "pending_accreditation";

/** Legado: free não é plano seller ofertável (ADR-018). Mantido só para leitura de dados antigos. */
export type LegacySellerPlanId = SellerPlanId | "free";

export type SellerPlan = {
  id: Exclude<SellerPlanId, "pending_accreditation">;
  name: string;
  priceCents: number;
  productLimit: number | null;
  features: string[];
};

export const SELLER_PLANS: SellerPlan[] = [
  {
    id: "lojista",
    name: "Lojista",
    priceCents: 4990,
    productLimit: 500,
    features: ["BuyList", "CRM", "Analytics", "Até 500 produtos"],
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 14990,
    productLimit: 5000,
    features: ["PDV", "API lojista", "Até 5000 produtos", "Tudo do Lojista"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceCents: 19900,
    productLimit: null,
    features: ["Produtos ilimitados", "Suporte dedicado", "Tudo do Pro"],
  },
];

const PAID = new Set(["lojista", "pro", "enterprise"]);
const PRO_PLUS = new Set(["pro", "enterprise"]);

export function planHasFeature(plan: string | undefined, feature: string): boolean {
  const p = plan || "pending_accreditation";
  if (["buylist", "crm", "analytics", "tournaments", "listings"].includes(feature)) {
    return PAID.has(p);
  }
  if (["pdv", "api"].includes(feature)) return PRO_PLUS.has(p);
  return false;
}

/** Verifica se o lojista ainda pode criar listagens dentro do limite do plano. */
export function canCreateListing(plan: string | undefined, currentCount: number): boolean {
  const def = SELLER_PLANS.find((item) => item.id === plan);
  if (!def) return false;
  if (!def.productLimit) return true;
  return currentCount < def.productLimit;
}

export function formatPlanPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}/mês`;
}

export function planLabel(plan: string | undefined): string {
  if (plan === "free") return "Legado (regularizar)";
  if (plan === "pending_accreditation") return "Em credenciamento";
  return SELLER_PLANS.find((p) => p.id === plan)?.name ?? "Em credenciamento";
}
