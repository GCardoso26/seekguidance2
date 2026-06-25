import { NextRequest, NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron/auth";
import { calculateHealthScore, persistHealthScore } from "@/lib/market/health-score";

const DEFAULT_GAMES = ["mtg", "pokemon", "yugioh", "lorcana", "onepiece"];

export async function GET(req: NextRequest) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const gameParam = req.nextUrl.searchParams.get("game");
  const games = gameParam ? [gameParam] : DEFAULT_GAMES;
  const results = [];

  for (const game of games) {
    const score = await calculateHealthScore(game);
    await persistHealthScore(score);
    results.push(score);
  }

  return NextResponse.json({ ok: true, games: results });
}
