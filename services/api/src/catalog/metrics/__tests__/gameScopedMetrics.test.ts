import { describe, expect, it, beforeEach } from "vitest";
import {
  recordCardsSynced,
  recordOffers,
  recordActiveSeller,
  snapshotGameMetrics,
  resetGameMetricsForTests,
} from "../gameScopedMetrics.js";

describe("gameScopedMetrics", () => {
  beforeEach(() => resetGameMetricsForTests());

  it("acumula counters por jogo sem misturar", () => {
    recordCardsSynced("MTG", 10);
    recordCardsSynced("POKEMON", 5);
    recordOffers("MTG", 3);
    recordActiveSeller("LORCANA");
    recordActiveSeller("LORCANA");

    const snap = snapshotGameMetrics();
    expect(snap.find((s) => s.gameCode === "MTG")?.cards_per_game).toBe(10);
    expect(snap.find((s) => s.gameCode === "POKEMON")?.cards_per_game).toBe(5);
    expect(snap.find((s) => s.gameCode === "LORCANA")?.active_sellers_per_game).toBe(2);
  });
});
