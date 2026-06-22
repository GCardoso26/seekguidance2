"use client";

import { useQuery } from "@tanstack/react-query";

export type BusinessAnalytics = {
  period: string;
  periodDays: number;
  dau: number;
  mau: number;
  totalUsers: number;
  proSubscribers: number;
  conversionRatePercent: number;
  churnRatePercent: number;
  ltvAverageBrl: number;
  ltvTotalBrl: number;
  topTcgs: Array<{ tcg: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  funnel: {
    checkoutStarted: number;
    checkoutCompleted: number;
    conversionPercent: number;
  };
  marketplace?: {
    period_days: number;
    dau: number;
    gmv_brl: number;
    conversion_rate: number;
    purchases: number;
    searches: number;
    top_cards: Array<{ card_name: string; purchases: number }>;
  };
  alerts: string[];
};

export function useBusinessAnalytics(period: string) {
  return useQuery({
    queryKey: ["admin-business-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?period=${encodeURIComponent(period)}`);
      if (!res.ok) throw new Error("Acesso negado ou API indisponível");
      return res.json() as Promise<BusinessAnalytics>;
    },
  });
}
