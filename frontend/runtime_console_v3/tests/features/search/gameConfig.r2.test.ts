import { describe, expect, it } from "vitest";
import { expandQueryTokens } from "@/features/search/fuzzy/synonyms";
import { getGameConfig } from "@/lib/game-config";

describe("R2 game-config synonyms", () => {
  it("Lorcana synonyms", () => {
    const tokens = expandQueryTokens("rapunzel", "lorcana");
    expect(tokens.some((t) => t.includes("gifted"))).toBe(true);
  });

  it("MTG synonyms", () => {
    const tokens = expandQueryTokens("bolt", "mtg");
    expect(tokens).toContain("lightning bolt");
  });

  it("Pokémon synonyms", () => {
    const tokens = expandQueryTokens("pika", "pokemon");
    expect(tokens).toContain("pikachu");
  });

  it("GameConfig rarities por jogo", () => {
    expect(getGameConfig("mtg")?.rarities.some((r) => r.value === "mythic")).toBe(true);
    expect(getGameConfig("pokemon")?.rarities.some((r) => r.value === "Illustration Rare")).toBe(
      true,
    );
    expect(getGameConfig("mtg")?.capabilities.commanderStyle).toBe(true);
    expect(getGameConfig("lorcana")?.market.releaseTier).toBe("R1");
  });
});
