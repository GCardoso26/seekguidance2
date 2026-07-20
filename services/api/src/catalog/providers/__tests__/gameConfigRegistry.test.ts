import { describe, expect, it } from "vitest";
import { getGameConfig, listGameConfigs, requireGameConfig } from "../gameConfigRegistry.js";

describe("gameConfigRegistry", () => {
  it("lista LORCANA, MTG e POKEMON", () => {
    const codes = listGameConfigs().map((c) => c.gameCode).sort();
    expect(codes).toEqual(["LORCANA", "MTG", "POKEMON"]);
  });

  it("aliases magic → MTG", () => {
    expect(getGameConfig("magic")?.gameCode).toBe("MTG");
  });

  it("require lança em desconhecido", () => {
    expect(() => requireGameConfig("NARUTO")).toThrow(/unknown_game_config/);
  });
});
