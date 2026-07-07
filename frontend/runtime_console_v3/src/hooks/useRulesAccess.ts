"use client";

import { useMemo } from "react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useJudgeCertification } from "@/hooks/useJudgeCertification";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { canAccessRules, rulesAccessReason, type RulesAccessReason } from "@/lib/rules-access";

export function useRulesAccess() {
  const { user, loading: authLoading } = useJudgeAuth();
  const { isAdmin, isJudge, role, loading: roleLoading } = useUserRole();
  const { tier, isLoading: subLoading } = useSubscription();
  const { certification, isLoading: certLoading } = useJudgeCertification();
  const { dashboard, dashboardLoading } = useSellerStore();

  const storePlan = String(
    (dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "",
  );

  const input = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      judgeRole: role,
      isAdmin: isAdmin || isJudge,
      hasActiveCertification: certification?.status === "active",
      subscriptionTier: tier,
      storePlan: storePlan || null,
    }),
    [user, role, isAdmin, isJudge, certification?.status, tier, storePlan],
  );

  const allowed = canAccessRules(input);
  const reason: RulesAccessReason | null = allowed ? null : rulesAccessReason(input);
  const loading = authLoading || roleLoading || subLoading || certLoading || dashboardLoading;

  return { allowed, reason, loading, input };
}
