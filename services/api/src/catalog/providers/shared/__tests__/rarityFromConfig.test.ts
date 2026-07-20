/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { displayRarityFromConfig } from "../rarityFromConfig.js";
import { mtgGameConfig } from "../../magic/GameConfig.js";
import { pokemonGameConfig } from "../../pokemon/GameConfig.js";
import { lorcanaGameConfig } from "../../lorcana/GameConfig.js";

describe("API rarityFromConfig — magic", () => {
  it("normaliza mythic Scryfall", () => {
    expect(displayRarityFromConfig(mtgGameConfig.rarities, "mythic")).toBe("Mythic Rare");
  });
});

describe("API rarityFromConfig — pokemon", () => {
  it("preserva Illustration Rare", () => {
    expect(displayRarityFromConfig(pokemonGameConfig.rarities, "Illustration Rare")).toBe(
      "Illustration Rare",
    );
  });
});

describe("API rarityFromConfig — lorcana", () => {
  it("mapeia Legendary", () => {
    expect(displayRarityFromConfig(lorcanaGameConfig.rarities, "Legendary")).toBe("Legendary");
  });
});
