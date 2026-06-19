"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useSubscription } from "@/hooks/useSubscription";
import {
  PLAN_LIMITS,
  type PlanFeature,
  type PlanTier,
} from "@/lib/plan-limits/constants";
import type { TcgType } from "@/types/judge";

type TournamentUsage = { count: number; limit: number | null; unlimited: boolean };

type Options = {
  favoriteTcgs?: TcgType[];
  onboardingComplete?: boolean;
  historyCount?: number;
};

const FEATURE_MESSAGES: Record<PlanFeature, string> = {
  consultas: "consultas diárias",
  tcgs: "jogos no plano Free",
  historico: "histórico na nuvem",
  torneios: "torneios por mês",
  export: "exportação de histórico",
};

export function usePlanGate(feature: PlanFeature, options: Options = {}) {
  const { tier, isPro } = useSubscription();
  const planTier: PlanTier = tier === "team" ? "team" : isPro ? "pro" : "free";
  const limits = PLAN_LIMITS[planTier];
  const limit = limits[feature];

  const planLimits = usePlanLimits({
    favoriteTcgs: options.favoriteTcgs,
    onboardingComplete: options.onboardingComplete,
  });

  const [tournamentUsage, setTournamentUsage] = useState<TournamentUsage>({
    count: 0,
    limit: planTier === "free" ? PLAN_LIMITS.free.torneios : null,
    unlimited: planTier !== "free",
  });

  const refreshTournamentUsage = useCallback(async () => {
    if (planTier !== "free") {
      setTournamentUsage({ count: 0, limit: null, unlimited: true });
      return;
    }
    try {
      const res = await fetch("/api/plan/tournament-usage", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as TournamentUsage;
      setTournamentUsage(data);
    } catch {
      /* mantém último valor */
    }
  }, [planTier]);

  useEffect(() => {
    if (feature === "torneios") void refreshTournamentUsage();
  }, [feature, refreshTournamentUsage]);

  const usage = (() => {
    switch (feature) {
      case "consultas":
        return planLimits.dailyUsed;
      case "tcgs":
        return planLimits.freeTcgs.length;
      case "historico":
        return options.historyCount ?? 0;
      case "torneios":
        return tournamentUsage.count;
      case "export":
        return planTier === "free" ? 1 : 0;
      default:
        return 0;
    }
  })();

  const allowed = (() => {
    if (planTier !== "free") return true;
    if (feature === "consultas") return planLimits.canAskQuestion();
    if (feature === "export") return planLimits.canExport();
    if (feature === "torneios") {
      return tournamentUsage.unlimited || tournamentUsage.count < (tournamentUsage.limit ?? 1);
    }
    if (feature === "historico") {
      return (options.historyCount ?? 0) <= PLAN_LIMITS.free.historico;
    }
    return usage < limit;
  })();

  const remaining =
    limit === Number.POSITIVE_INFINITY || limit === 0
      ? Number.POSITIVE_INFINITY
      : Math.max(0, limit - usage);

  const upgradeCta =
    planTier === "free" && !allowed
      ? `Limite de ${FEATURE_MESSAGES[feature]} atingido. Assine Pro por R$ 29/mês.`
      : planTier === "free" && remaining !== Number.POSITIVE_INFINITY && remaining <= 5
        ? `Restam ${remaining} ${FEATURE_MESSAGES[feature]}. Assine Pro por R$ 29/mês.`
        : null;

  return {
    allowed,
    remaining,
    usage,
    limit: limit === Number.POSITIVE_INFINITY ? null : limit,
    showGate: !allowed,
    upgradeCta,
    planTier,
    isPro: planTier !== "free",
    refreshTournamentUsage,
    refreshDailyCount: planLimits.refreshDailyCount,
  };
}
