import { API_BASE, stripeApiHeaders } from "@/lib/stripe/stripe-api-headers";

export type SubscriptionTier = "free" | "pro" | "team";

export async function getSubscriptionTier(userId: string | null): Promise<SubscriptionTier> {
  if (!userId) return "free";
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/stripe/subscription`, {
      headers: await stripeApiHeaders(userId),
      cache: "no-store",
    });
    if (!res.ok) return "free";
    const data = (await res.json()) as { tier?: string };
    if (data.tier === "pro" || data.tier === "team") return data.tier;
    return "free";
  } catch {
    return "free";
  }
}

export function isUnlimitedTier(tier: SubscriptionTier): boolean {
  return tier === "pro" || tier === "team";
}
