"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { useFinanceChargebacks } from "@/hooks/useSellerFinanceS6";
import { useFinancePayouts } from "@/hooks/useSellerFinance";
import { useSellerStore } from "@/hooks/useSellerStore";
import {
  buildOperationalActions,
  type OperationalActionItem,
} from "@/lib/seller-operational-actions";

export function useOperationalSnapshot(enabled = true) {
  const overview = useDashboardOverview(enabled);
  const { dashboard } = useSellerStore();
  const chargebacks = useFinanceChargebacks();
  const payouts = useFinancePayouts();

  const inactiveQuery = useQuery({
    queryKey: ["seller-listings-count", "inactive"],
    queryFn: async () => {
      const res = await fetch("/api/seller/listings?status=inactive&page=1&limit=1");
      if (!res.ok) return 0;
      const data = (await res.json()) as { total?: number };
      return Number(data.total ?? 0);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const actions: OperationalActionItem[] = useMemo(() => {
    const pending = dashboard?.pending as { disputes?: number; shipments?: number } | undefined;
    const kpis = dashboard?.kpis as { active_listings?: number } | undefined;
    const payoutData = payouts.data as { pending_cents?: number } | undefined;

    return buildOperationalActions(overview.data, {
      chargebacksOpen: chargebacks.data?.open_count ?? 0,
      pendingPayoutCents: payoutData?.pending_cents ?? 0,
      disputesCount: Number(pending?.disputes ?? 0),
      activeListings: Number(kpis?.active_listings ?? 0),
      inactiveListings: inactiveQuery.data ?? 0,
    });
  }, [overview.data, chargebacks.data, payouts.data, dashboard, inactiveQuery.data]);

  const criticalCount = actions.filter((a) => a.severity === "critical").length;

  return {
    actions,
    criticalCount,
    isLoading: overview.isLoading || chargebacks.isLoading || payouts.isLoading,
    overview: overview.data,
    refetch: () => {
      void overview.refetch();
      void chargebacks.refetch();
      void payouts.refetch();
    },
  };
}
