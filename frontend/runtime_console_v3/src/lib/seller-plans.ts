export type SellerPlanId = "free" | "lojista" | "pro" | "enterprise";

export type SellerPlan = {
  id: SellerPlanId;
  name: string;
  priceCents: number;
  productLimit: number | null;
  features: string[];
};

export const SELLER_PLANS: SellerPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    priceCents: 0,
    productLimit: 50,
    features: ["Escrow", "Listagem básica", "Até 50 produtos"],
  },
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

export function planHasFeature(plan: string | undefined, feature: string): boolean {
  const p = plan || "free";
  const lojistaPlus = new Set(["lojista", "pro", "enterprise"]);
  const proPlus = new Set(["pro", "enterprise"]);
  if (feature === "listings") return true;
  if (["buylist", "crm", "analytics"].includes(feature)) return lojistaPlus.has(p);
  if (["pdv", "api"].includes(feature)) return proPlus.has(p);
  return false;
}

/** Verifica se o lojista ainda pode criar listagens dentro do limite do plano. */
export function canCreateListing(plan: string | undefined, currentCount: number): boolean {
  const def = SELLER_PLANS.find((item) => item.id === (plan || "free"));
  if (!def?.productLimit) return true;
  return currentCount < def.productLimit;
}

export function formatPlanPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}/mês`;
}

export function planLabel(plan: string | undefined): string {
  return SELLER_PLANS.find((p) => p.id === plan)?.name ?? "Gratuito";
}
