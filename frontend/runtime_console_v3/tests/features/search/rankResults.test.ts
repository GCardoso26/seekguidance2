import { describe, expect, it } from "vitest";
import { rankSearchResults } from "@/features/search/ranking/rankResults";
import type { SearchResult } from "@/features/search/types";

const sample: SearchResult[] = [
  {
    id: "a",
    group: "cards",
    title: "Charizard",
    href: "/a",
    providerId: "cards",
  },
  {
    id: "b",
    group: "cards",
    title: "Machamp",
    href: "/b",
    providerId: "cards",
  },
];

describe("rankSearchResults", () => {
  it("ordena por relevância fuzzy", () => {
    const ranked = rankSearchResults("char", sample);
    expect(ranked[0]?.title).toBe("Charizard");
  });

  it("boost favoritos", () => {
    const ranked = rankSearchResults("mach", sample, {
      favoriteIds: new Set(["b"]),
    });
    expect(ranked[0]?.id).toBe("b");
  });
});
