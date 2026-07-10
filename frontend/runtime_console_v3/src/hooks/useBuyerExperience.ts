"use client";

import { useQuery } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import type {
  BuyerDashboard,
  BuyerInsightsResponse,
  BuyerRecommendations,
  DeckShopPlan,
  SmartCartAnalysis,
  SmartCartGoal,
  StoreReputationPublic,
} from "@/types/buyer-experience";

export const BUYER_DASHBOARD_KEY = ["buyer-dashboard"] as const;
export const BUYER_INSIGHTS_KEY = ["buyer-ai-insights"] as const;
export const BUYER_RECS_KEY = ["buyer-recommendations"] as const;
export const SMART_CART_KEY = ["smart-cart"] as const;

export function useBuyerDashboard() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: BUYER_DASHBOARD_KEY,
    enabled: Boolean(user),
    staleTime: 30_000,
    queryFn: async (): Promise<BuyerDashboard> => {
      const res = await fetch("/api/buyer/dashboard");
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("buyer_dashboard_failed");
      return res.json();
    },
  });
}

export function useBuyerInsights() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: BUYER_INSIGHTS_KEY,
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async (): Promise<BuyerInsightsResponse> => {
      const res = await fetch("/api/buyer/ai/insights");
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("buyer_insights_failed");
      return res.json();
    },
  });
}

export function useBuyerRecommendations(limit = 12) {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: [...BUYER_RECS_KEY, limit],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async (): Promise<BuyerRecommendations> => {
      const res = await fetch(`/api/buyer/recommendations?limit=${limit}`);
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("buyer_recs_failed");
      return res.json();
    },
  });
}

export function useSmartCart(goal: SmartCartGoal | string = "best_value") {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: [...SMART_CART_KEY, goal],
    enabled: Boolean(user),
    staleTime: 15_000,
    queryFn: async (): Promise<SmartCartAnalysis> => {
      const res = await fetch(`/api/marketplace/shop/cart/smart?goal=${encodeURIComponent(goal)}`);
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("smart_cart_failed");
      return res.json();
    },
  });
}

export function useStoreReputation(slug: string) {
  return useQuery({
    queryKey: ["store-reputation", slug],
    enabled: Boolean(slug),
    staleTime: 60_000,
    queryFn: async (): Promise<StoreReputationPublic> => {
      const res = await fetch(`/api/marketplace/shop/stores/slug/${encodeURIComponent(slug)}/reputation`);
      if (!res.ok) throw new Error("store_reputation_failed");
      return res.json();
    },
  });
}

export function useDeckShopPlan(deckId: string, mode: "all" | "missing" = "missing") {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: ["deck-shop", deckId, mode],
    enabled: Boolean(user && deckId),
    staleTime: 30_000,
    queryFn: async (): Promise<DeckShopPlan> => {
      const res = await fetch(`/api/buyer/decks/${encodeURIComponent(deckId)}/shop?mode=${mode}`);
      if (!res.ok) throw new Error("deck_shop_failed");
      return res.json();
    },
  });
}
