import { describe, expect, it } from "vitest";
import { formatRarityDisplay, getRarityOptions } from "@/lib/game-config/rarity";

describe("rarity.lorcana", () => {
  it("mantém raridades Lorcana inalteradas", () => {
    const opts = getRarityOptions("lorcana").map((r) => r.label);
    expect(opts).toContain("Legendary");
    expect(opts).toContain("Enchanted");
    expect(opts).toContain("Super Rare");
  });

  it("formata Super Rare do dataset", () => {
    expect(formatRarityDisplay("lorcana", "Super Rare")).toBe("Super Rare");
  });
});
