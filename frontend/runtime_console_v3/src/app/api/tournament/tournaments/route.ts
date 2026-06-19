import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FREE_TOURNAMENTS_PER_MONTH } from "@/lib/plan-limits/constants";
import { getSubscriptionTier, isUnlimitedTier } from "@/lib/api/subscription-tier";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

async function countMonthlyTournaments(userId: string): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return 0;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const supabase = createClient(url, serviceKey, { db: { schema: "tcg_judge" } });
  const { count } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .gte("created_at", monthStart);
  return count ?? 0;
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments${qs}`, { cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Auth não configurado" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const tier = await getSubscriptionTier(user.id);
  if (!isUnlimitedTier(tier)) {
    const count = await countMonthlyTournaments(user.id);
    if (count >= FREE_TOURNAMENTS_PER_MONTH) {
      return NextResponse.json(
        { detail: "Limite de 1 torneio/mês no plano Free. Assine Pro para criar mais." },
        { status: 403 },
      );
    }
  }

  const body = await req.text();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments`, {
      method: "POST",
      headers: await tournamentProxyHeaders(),
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
