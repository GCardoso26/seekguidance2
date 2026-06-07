import { describe, expect, it } from "vitest";
import { GameLogBuilder } from "@/lib/game-log/GameLogBuilder";

const actor = { player_id: "p1", player_name: "Test", seat: 1 as const };
const state = { zones: [] };

describe("GameLogBuilder", () => {
  it("constrói 50+ entradas com hash chain íntegra", () => {
    const builder = new GameLogBuilder("match-test", "lorcana");
    for (let i = 0; i < 55; i++) {
      builder.addEntry("draw", actor, { n: i }, state, { turn: Math.floor(i / 5) + 1 });
    }
    const log = builder.getLog();
    expect(log).toHaveLength(55);
    expect(log[54]?.sequence).toBe(54);
    expect(builder.verifyIntegrity()).toBe(true);
    const exported = JSON.parse(builder.export());
    expect(exported.entries).toHaveLength(55);
  });
});
