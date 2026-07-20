import { describe, expect, it } from "vitest";
import { getRarityOptions, isRarityAllowedForGame } from "@/lib/game-config/rarity";

describe("rarity.magic", () => {
  it("usa raridades Magic — nunca Legendary/Enchanted", () => {
    const labels = getRarityOptions("mtg").map((r) => r.label);
    expect(labels).toContain("Mythic Rare");
    expect(labels).not.toContain("Legendary");
    expect(labels).not.toContain("Enchanted");
  });

  it("rejeita Legendary no syntax check", () => {
    expect(isRarityAllowedForGame("mtg", "legendary")).toBe(false);
    expect(isRarityAllowedForGame("mtg", "mythic")).toBe(true);
  });
});
