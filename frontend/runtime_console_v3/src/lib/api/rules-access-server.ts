import { NextResponse } from "next/server";
import { isJudgeRole } from "@/lib/judge-rbac";
import { getSubscriptionTier, isUnlimitedTier } from "@/lib/api/subscription-tier";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import {
  canAccessRules,
  rulesAccessReason,
  type RulesAccessInput,
  type RulesAccessReason,
} from "@/lib/rules-access";

const LGS_STORE_PLANS = new Set(["lojista", "pro", "enterprise"]);

export async function resolveRulesAccessInput(userId: string | null): Promise<RulesAccessInput> {
  if (!userId) {
    return { isAuthenticated: false };
  }

  const tier = await getSubscriptionTier(userId);
  const input: RulesAccessInput = {
    isAuthenticated: true,
    subscriptionTier: tier,
  };

  if (isUnlimitedTier(tier)) {
    return input;
  }

  try {
    const headers = await tournamentProxyHeaders();
    const [meRes, certRes, dashRes] = await Promise.all([
      fetch(`${TOURNAMENT_API_BASE}/runtime/judge/me`, { headers, cache: "no-store" }),
      fetch(`${TOURNAMENT_API_BASE}/runtime/judge/judge/certifications/me`, { headers, cache: "no-store" }),
      fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/dashboard`, { headers, cache: "no-store" }),
    ]);

    if (meRes.ok) {
      const me = (await meRes.json()) as { role?: string; is_admin?: boolean };
      input.judgeRole = me.role ?? null;
      input.isAdmin = Boolean(me.is_admin) || me.role === "admin";
    }

    if (certRes.ok) {
      const certs = (await certRes.json()) as Array<{ status?: string }>;
      input.hasActiveCertification = Array.isArray(certs) && certs.some((c) => c.status === "active");
    }

    if (dashRes.ok) {
      const dash = (await dashRes.json()) as { store?: { subscription_plan?: string } };
      const plan = String(dash.store?.subscription_plan ?? "").toLowerCase();
      if (LGS_STORE_PLANS.has(plan)) {
        input.storePlan = plan;
      }
    }
  } catch {
    /* mantém input parcial */
  }

  return input;
}

export async function resolveRulesAccess(userId: string | null): Promise<{
  allowed: boolean;
  reason?: RulesAccessReason;
}> {
  const input = await resolveRulesAccessInput(userId);
  if (canAccessRules(input)) return { allowed: true };
  return { allowed: false, reason: rulesAccessReason(input) };
}

export function rulesAccessDeniedResponse(reason: RulesAccessReason) {
  const detail =
    reason === "login_required"
      ? "Faça login para acessar regras e rulings oficiais."
      : "Acesso a regras requer certificação de juiz, plano PRO/LGS ou vínculo com loja.";
  return NextResponse.json({ detail, code: "rules_access_denied", reason }, { status: 403 });
}
