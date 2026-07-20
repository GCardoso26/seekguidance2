import { describe, expect, it } from "vitest";
import { getRarityOptions, isRarityAllowedForGame } from "@/lib/game-config/rarity";

describe("rarity.pokemon", () => {
  it("usa raridades Pokémon — nunca Enchanted", () => {
    const labels = getRarityOptions("pokemon").map((r) => r.label);
    expect(labels).toContain("Illustration Rare");
    expect(labels).toContain("Hyper Rare");
    expect(labels).not.toContain("Enchanted");
    expect(labels).not.toContain("Legendary");
  });

  it("aceita Special Illustration Rare", () => {
    expect(isRarityAllowedForGame("pokemon", "Special Illustration Rare")).toBe(true);
  });
});
