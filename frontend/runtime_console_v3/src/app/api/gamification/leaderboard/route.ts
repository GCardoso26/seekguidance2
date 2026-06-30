import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockLeaderboard } from "@/lib/gamification-mock";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const city = request.nextUrl.searchParams.get("city") ?? undefined;
  const game = request.nextUrl.searchParams.get("game") ?? undefined;

  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (city) qs.set("city", city);
    if (game) qs.set("game", game);
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/gamification/leaderboard?${qs}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const data = mockLeaderboard(user?.id, { city, game });
  return NextResponse.json(data);
}
