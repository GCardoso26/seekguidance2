import { describe, expect, it } from "vitest";
import { GameLogBuilder } from "@/lib/game-log/GameLogBuilder";
import { GameLogParser } from "@/lib/game-log/GameLogParser";

const actor = { player_id: "p1", player_name: "A", seat: 1 as const };
const state = { zones: [] };

describe("GameLogParser", () => {
  it("filtra por action, player e phase", () => {
    const builder = new GameLogBuilder("m1", "lorcana");
    builder.addEntry("game_start", actor, {}, state);
    builder.addEntry("judge_call", actor, {}, state, { phase: "combat" });
    builder.addEntry(
      "draw",
      { player_id: "p2", player_name: "B", seat: 2 },
      {},
      state,
      { phase: "main" },
    );
    const parser = new GameLogParser();
    parser.load(builder.getLog());
    expect(parser.filterByAction("judge_call")).toHaveLength(1);
    expect(parser.filterByPlayer("p2")).toHaveLength(1);
    expect(parser.filterByPhase("combat")).toHaveLength(1);
    expect(parser.findUndoRequests()).toHaveLength(0);
  });

  it("detecta anomalia em cadeia quebrada", () => {
    const builder = new GameLogBuilder("m1", "lorcana");
    builder.addEntry("game_start", actor, {}, state);
    const entries = builder.getLog();
    entries[0] = { ...entries[0], hash: "invalid" };
    const parser = new GameLogParser();
    parser.load(entries);
    const anomalies = parser.detectAnomalies();
    expect(anomalies.some((a) => a.code === "HASH_CHAIN_BROKEN")).toBe(true);
  });
});
