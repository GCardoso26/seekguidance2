"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatePriceAlertInput, PriceAlert } from "@/types/alert";

export const ALERTS_QUERY_KEY = ["price-alerts"] as const;

async function fetchAlerts(status?: string): Promise<PriceAlert[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`/api/alerts${qs}`);
  if (res.status === 401) throw new Error("login_required");
  if (!res.ok) throw new Error("fetch_failed");
  const data = (await res.json()) as { alerts: PriceAlert[] };
  return data.alerts ?? [];
}

export function usePriceAlerts(status?: string) {
  return useQuery({
    queryKey: [...ALERTS_QUERY_KEY, status],
    queryFn: () => fetchAlerts(status),
    staleTime: 60_000,
  });
}

export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePriceAlertInput) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(typeof data.detail === "string" ? data.detail : "create_failed");
      }
      const data = (await res.json()) as { alert: PriceAlert };
      return data.alert;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
    },
  });
}

export function useDeletePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
    },
  });
}
