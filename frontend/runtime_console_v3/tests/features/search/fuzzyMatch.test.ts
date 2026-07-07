import { describe, expect, it } from "vitest";
import { fuzzyScore, matchesFuzzy, normalizeSearchText } from "@/features/search/fuzzy/fuzzyMatch";
import { expandQueryTokens } from "@/features/search/fuzzy/synonyms";

describe("fuzzyMatch", () => {
  it("é accent-insensitive", () => {
    expect(normalizeSearchText("Pokémon")).toBe("pokemon");
  });

  it("prioriza prefixo", () => {
    expect(fuzzyScore("char", "charizard")).toBeGreaterThan(fuzzyScore("char", "machamp"));
  });

  it("expande sinônimos char → charizard", () => {
    const tokens = expandQueryTokens("char");
    expect(tokens).toContain("charizard");
    expect(matchesFuzzy("char", "Charizard")).toBe(true);
  });
});
