import { isJudgeRole } from "@/lib/judge-rbac";

export type RulesAccessReason = "login_required" | "upgrade_required";

export type RulesAccessInput = {
  isAuthenticated: boolean;
  judgeRole?: string | null;
  isAdmin?: boolean;
  hasActiveCertification?: boolean;
  subscriptionTier?: "free" | "pro" | "team";
  storePlan?: string | null;
};

const LGS_STORE_PLANS = new Set(["lojista", "pro", "enterprise"]);

/** Juiz certificado/role, assinatura PRO/LGS (player) ou plano lojista LGS+. */
export function canAccessRules(input: RulesAccessInput): boolean {
  if (!input.isAuthenticated) return false;
  if (input.isAdmin || isJudgeRole(input.judgeRole ?? null)) return true;
  if (input.hasActiveCertification) return true;
  if (input.subscriptionTier === "pro" || input.subscriptionTier === "team") return true;
  const plan = String(input.storePlan ?? "").toLowerCase();
  if (plan && LGS_STORE_PLANS.has(plan)) return true;
  return false;
}

export function rulesAccessReason(input: RulesAccessInput): RulesAccessReason {
  if (!input.isAuthenticated) return "login_required";
  return "upgrade_required";
}
