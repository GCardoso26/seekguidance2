import { NextRequest, NextResponse } from "next/server";
import { GameLogBuilder } from "@/lib/game-log/GameLogBuilder";

export async function GET(req: NextRequest) {
  const matchId = new URL(req.url).searchParams.get("match_id") ?? "demo";
  const builder = new GameLogBuilder(matchId, "lorcana");
  const actor = { player_id: "p1", player_name: "Jogador 1", seat: 1 as const };
  const state = { zones: [] };
  builder.addEntry("game_start", actor, {}, state);
  builder.addEntry("turn_start", actor, { turn: 1 }, state, { turn: 1 });
  builder.addEntry("judge_call", actor, { reason: "Dúvida de ruling" }, state);
  return NextResponse.json({ entries: builder.getLog() });
}
