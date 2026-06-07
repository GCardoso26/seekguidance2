"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { DEFAULT_FEATURES, type SubscriptionFeatures } from "@/lib/subscription/features";
import type { BillingCycle, PaidPlanId } from "@/lib/stripe/prices";
import { stripePriceId, tierToStripe } from "@/lib/stripe/prices";
import { trackEvent } from "@/lib/analytics";

export type SubscriptionState = {
  tier: "free" | "pro" | "team";
  status: string;
  features: SubscriptionFeatures;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
};

async function fetchSubscription(): Promise<SubscriptionState> {
  const res = await fetch("/api/stripe/subscription");
  if (!res.ok) {
    return { tier: "free", status: "active", features: DEFAULT_FEATURES };
  }
  return res.json() as Promise<SubscriptionState>;
}

export function useSubscription() {
  const { user } = useJudgeAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: fetchSubscription,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const tier = query.data?.tier ?? "free";
  const features = query.data?.features ?? DEFAULT_FEATURES;

  return {
    ...query,
    tier,
    status: query.data?.status ?? "active",
    features,
    currentPeriodEnd: query.data?.current_period_end,
    cancelAtPeriodEnd: query.data?.cancel_at_period_end,
    isLoading: query.isLoading,
    isPro: tier === "pro" || tier === "team",
    isTeam: tier === "team",
  };
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      plan: PaidPlanId;
      billingCycle: BillingCycle;
    }) => {
      const priceId = stripePriceId(params.plan, params.billingCycle);
      if (!priceId) {
        throw new Error("Preços Stripe não configurados (env NEXT_PUBLIC_STRIPE_PRICE_*)");
      }
      void trackEvent("checkout_started", {
        plan: params.plan,
        billing_cycle: params.billingCycle,
      });
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: priceId,
          tier: tierToStripe(params.plan),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? "Checkout falhou");
      }
      return res.json() as Promise<{ url: string; session_id: string }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Portal indisponível");
      return res.json() as Promise<{ url: string }>;
    },
  });
}
