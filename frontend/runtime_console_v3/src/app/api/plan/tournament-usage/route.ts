import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FREE_TOURNAMENTS_PER_MONTH } from "@/lib/plan-limits/constants";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";
import { getSubscriptionTier, isUnlimitedTier } from "@/lib/api/subscription-tier";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ count: 0, limit: FREE_TOURNAMENTS_PER_MONTH, unlimited: false });
  }

  const tier = await getSubscriptionTier(userId);
  if (isUnlimitedTier(tier)) {
    return NextResponse.json({ count: 0, limit: null, unlimited: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ count: 0, limit: FREE_TOURNAMENTS_PER_MONTH, unlimited: false });
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });
  const { count, error } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .gte("created_at", monthStart);

  if (error) {
    return NextResponse.json({ count: 0, limit: FREE_TOURNAMENTS_PER_MONTH, unlimited: false });
  }

  return NextResponse.json({
    count: count ?? 0,
    limit: FREE_TOURNAMENTS_PER_MONTH,
    unlimited: false,
  });
}
