export type BillingCycle = "monthly" | "annual";
export type PaidPlanId = "pro" | "team";
export type SubscriptionTier = "free" | "pro" | "team";

export const STRIPE_PRICE_KEYS: Record<PaidPlanId, Record<BillingCycle, string>> = {
  pro: {
    monthly:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_SPIKE ??
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_PRO ??
      "",
    annual:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_SPIKE ??
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_PRO ??
      "",
  },
  team: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEAM ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_TEAM ?? "",
  },
};

export function stripePriceId(plan: PaidPlanId, cycle: BillingCycle): string {
  return STRIPE_PRICE_KEYS[plan][cycle];
}

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      STRIPE_PRICE_KEYS.pro.monthly &&
      STRIPE_PRICE_KEYS.team.monthly,
  );
}

export function tierToStripe(tier: PaidPlanId): "spike" | "team" {
  return tier === "team" ? "team" : "spike";
}
