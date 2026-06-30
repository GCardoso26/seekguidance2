"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { awardXpFireAndForget } from "@/lib/award-xp-client";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  NOTIFICATIONS_FEED_KEY,
  NOTIFICATIONS_UNREAD_KEY,
} from "@/lib/notifications";
import type { ShopProduct } from "@/lib/marketplace-shop";
import {
  normalizeAlertsResponse,
  WISHLIST_PRICE_ALERTS_QUERY_KEY,
} from "@/lib/wishlist-price-alert";
import type { WishlistPriceAlert, WishlistPriceAlertsResponse } from "@/types/wishlist-price-alert";

const STALE_TIME = 5 * 60 * 1000;

async function fetchAlerts(): Promise<WishlistPriceAlertsResponse> {
  const res = await fetch("/api/wishlist/alerts");
  if (res.status === 401) return { alerts: [], total: 0 };
  if (!res.ok) throw new Error("alerts_fetch_failed");
  const data = await res.json();
  const alerts = normalizeAlertsResponse(data);
  return { alerts, total: alerts.length };
}

export function useWishlistPriceAlerts() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: WISHLIST_PRICE_ALERTS_QUERY_KEY,
    queryFn: fetchAlerts,
    enabled: Boolean(user),
    staleTime: STALE_TIME,
  });
}

export function useActivePriceAlertProductIds() {
  const { data } = useWishlistPriceAlerts();
  return new Set(
    (data?.alerts ?? []).filter((a) => a.is_active).map((a) => a.product_id),
  );
}

export function usePriceAlertForProduct(productId: string): WishlistPriceAlert | undefined {
  const { data } = useWishlistPriceAlerts();
  return (data?.alerts ?? []).find((a) => a.product_id === productId && a.is_active);
}

export function useCreatePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_id: string;
      alert_type: WishlistPriceAlert["alert_type"];
      target_price: number | null;
      percentage: number | null;
      baseline_price_cents: number;
      product?: ShopProduct;
    }) => {
      const res = await fetch("/api/wishlist/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("alert_create_failed");
      return res.json() as Promise<WishlistPriceAlert>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WISHLIST_PRICE_ALERTS_QUERY_KEY });
    },
  });
}

export function useUpdatePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<WishlistPriceAlert, "alert_type" | "target_price" | "percentage" | "is_active">>;
    }) => {
      const res = await fetch(`/api/wishlist/alerts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("alert_update_failed");
      return res.json() as Promise<WishlistPriceAlert>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WISHLIST_PRICE_ALERTS_QUERY_KEY });
    },
  });
}

export function useDeletePriceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wishlist/alerts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("alert_delete_failed");
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WISHLIST_PRICE_ALERTS_QUERY_KEY });
    },
  });
}

export function useSimulatePriceDrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: string; new_price_cents: number }) => {
      const res = await fetch("/api/wishlist/alerts/simulate-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("simulate_drop_failed");
      return res.json() as Promise<{ triggered: boolean; notification?: unknown }>;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: WISHLIST_PRICE_ALERTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_FEED_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
      if (data.triggered) {
        awardXpFireAndForget("price_alert_triggered", qc);
      }
    },
  });
}

export function usePriceAlertGate() {
  const router = useRouter();
  const { user } = useJudgeAuth();

  return function requireAuth(): boolean {
    if (user) return true;
    const next =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/marketplace";
    router.push(`/entrar?next=${encodeURIComponent(next)}`);
    return false;
  };
}
