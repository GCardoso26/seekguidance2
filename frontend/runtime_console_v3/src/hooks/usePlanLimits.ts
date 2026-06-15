"use client";

import { useCallback, useEffect, useState } from "react";
import { FREE_DAILY_QUESTIONS, FREE_TCG_IDS } from "@/lib/plan-limits/constants";
import { useSubscription } from "@/hooks/useSubscription";
import type { TcgType } from "@/types/judge";

export { FREE_DAILY_QUESTIONS, FREE_TCG_IDS };

export function usePlanLimits() {
  const { isPro, isTeam, isLoading } = useSubscription();
  const [dailyUsed, setDailyUsed] = useState(0);
  const [serverUnlimited, setServerUnlimited] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/judge/daily-usage", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number; unlimited?: boolean };
      setDailyUsed(data.count ?? 0);
      if (data.unlimited) setServerUnlimited(true);
    } catch {
      /* mantém último valor */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlimited = isPro || isTeam || serverUnlimited;

  const canAskQuestion = useCallback(() => {
    if (unlimited) return true;
    return dailyUsed < FREE_DAILY_QUESTIONS;
  }, [unlimited, dailyUsed]);

  const canUseTCG = useCallback(
    (tcgId: TcgType) => {
      if (unlimited) return true;
      return FREE_TCG_IDS.includes(tcgId);
    },
    [unlimited],
  );

  const canExport = useCallback(() => unlimited, [unlimited]);

  const remainingToday = unlimited
    ? Infinity
    : Math.max(0, FREE_DAILY_QUESTIONS - dailyUsed);

  return {
    isLoading,
    isPro: unlimited,
    dailyLimit: unlimited ? null : FREE_DAILY_QUESTIONS,
    dailyUsed,
    remainingToday,
    freeTcgs: FREE_TCG_IDS,
    canAskQuestion,
    canUseTCG,
    canExport,
    refreshDailyCount: refresh,
  };
}
