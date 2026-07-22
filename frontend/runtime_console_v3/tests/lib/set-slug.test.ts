import { describe, expect, it } from "vitest";
import { setCanonicalSlug, setMatchesSlug, slugifySet } from "@/lib/set-slug";
import { gameSetPath, gameExpansionDetailPath } from "@/lib/game-routes";

describe("set-slug + expansion routes", () => {
  it("slugifies expansion names", () => {
    expect(slugifySet("Prismatic Evolutions")).toBe("prismatic-evolutions");
    expect(slugifySet("Final Fantasy")).toBe("final-fantasy");
  });

  it("matches by name slug or code", () => {
    const set = { code: "PRE", name: "Prismatic Evolutions" };
    expect(setMatchesSlug(set, "prismatic-evolutions")).toBe(true);
    expect(setMatchesSlug(set, "pre")).toBe(true);
    expect(setMatchesSlug(set, "other")).toBe(false);
    expect(setCanonicalSlug(set)).toBe("prismatic-evolutions");
  });

  it("builds set landing paths", () => {
    expect(gameSetPath("pokemon", "prismatic-evolutions")).toBe(
      "/pokemon/sets/prismatic-evolutions",
    );
    expect(gameExpansionDetailPath("mtg", "final-fantasy")).toBe(
      "/mtg/expansions/final-fantasy",
    );
    expect(gameSetPath("magic", "final-fantasy")).toBe("/magic/sets/final-fantasy");
  });
});
