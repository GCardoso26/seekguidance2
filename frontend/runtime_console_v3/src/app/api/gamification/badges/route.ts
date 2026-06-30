import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { badgesWithUnlockState, computeUnlockedBadgeIds } from "@/lib/badges";
import { mockBadgeUnlockStats, mockUnlockedAt } from "@/lib/gamification-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/gamification/badges`, {
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  const unlockedAt = mockUnlockedAt(user.id);
  const stats = mockBadgeUnlockStats(user.id);
  const unlocked = new Set(Object.keys(unlockedAt));
  for (const id of computeUnlockedBadgeIds(stats)) unlocked.add(id);

  return NextResponse.json({
    badges: badgesWithUnlockState(unlocked, unlockedAt),
  });
}
