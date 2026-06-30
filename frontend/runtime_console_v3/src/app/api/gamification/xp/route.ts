import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAwardXp } from "@/lib/gamification-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import type { XpAction } from "@/types/gamification-profile";

const VALID_ACTIONS = new Set<XpAction>([
  "marketplace_purchase",
  "seller_sale",
  "tournament_registration",
  "price_alert_triggered",
  "product_review",
  "friend_invite",
]);

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action as XpAction;
  if (!action || !VALID_ACTIONS.has(action)) {
    return NextResponse.json({ detail: "action inválida" }, { status: 400 });
  }

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/gamification/xp/award`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      body: JSON.stringify({ action }),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  const result = mockAwardXp(user.id, action);
  return NextResponse.json(result);
}
