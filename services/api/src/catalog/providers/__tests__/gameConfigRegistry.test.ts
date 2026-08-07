import { describe, expect, it } from "vitest";
import { getGameConfig, listGameConfigs, requireGameConfig } from "../gameConfigRegistry.js";

describe("gameConfigRegistry", () => {
  it("lista LORCANA, MTG, POKEMON e GUNDAM", () => {
    const codes = listGameConfigs().map((c) => c.gameCode).sort();
    expect(codes).toEqual(["GUNDAM", "LORCANA", "MTG", "POKEMON"]);
  });

  it("aliases magic → MTG", () => {
    expect(getGameConfig("magic")?.gameCode).toBe("MTG");
  });

  it("aliases gundam-card-game → GUNDAM", () => {
    expect(getGameConfig("gundam-card-game")?.gameCode).toBe("GUNDAM");
    expect(getGameConfig("GUNDAM")?.market.releaseTier).toBe("unlisted");
    expect(getGameConfig("GUNDAM")?.capabilities.sealedProduct).toBe(true);
  });

  it("require lança em desconhecido", () => {
    expect(() => requireGameConfig("NARUTO")).toThrow(/unknown_game_config/);
  });
});
