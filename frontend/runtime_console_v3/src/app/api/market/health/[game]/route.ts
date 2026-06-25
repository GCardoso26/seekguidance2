import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateHealthScore } from "@/lib/market/health-score";
import { getCachedJson, setCachedJson } from "@/lib/redis";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ game: string }> },
) {
  const { game } = await params;
  const cacheKey = `health:${game}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("market_health_scores")
      .select("*")
      .eq("game_code", game.toLowerCase())
      .maybeSingle();

    if (data) {
      const payload = {
        game: data.game_code,
        score: data.score,
        status: data.status,
        metrics: data.metrics,
        computedAt: data.computed_at,
      };
      await setCachedJson(cacheKey, payload, 86400);
      return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
    }
  }

  const live = await calculateHealthScore(game);
  await setCachedJson(cacheKey, live, 3600);
  return NextResponse.json(live, { headers: { "X-Cache": "COMPUTE" } });
}
