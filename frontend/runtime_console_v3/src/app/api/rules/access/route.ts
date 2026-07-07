import { NextResponse } from "next/server";
import { resolveRulesAccess, resolveRulesAccessInput } from "@/lib/api/rules-access-server";
import { canAccessRules } from "@/lib/rules-access";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  const input = await resolveRulesAccessInput(userId);
  const access = await resolveRulesAccess(userId);
  return NextResponse.json({
    allowed: canAccessRules(input),
    reason: access.reason ?? null,
  });
}
