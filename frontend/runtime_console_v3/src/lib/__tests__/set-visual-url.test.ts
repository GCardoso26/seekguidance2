import { describe, expect, it } from "vitest";
import { resolveSetVisualUrl } from "@/lib/set-visual-url";

describe("resolveSetVisualUrl", () => {
  it("prefers cover over icon and logo", () => {
    expect(
      resolveSetVisualUrl({
        coverUrl: "https://cdn.example/cover.jpg",
        iconUrl: "https://cdn.example/icon.png",
        fallback: "/logos/lorcana.webp",
      }),
    ).toBe("https://cdn.example/cover.jpg");
  });

  it("skips scryfall svg icons", () => {
    expect(
      resolveSetVisualUrl({
        coverUrl: null,
        iconUrl: "https://svgs.scryfall.io/sets/mh3.svg",
        fallback: "/logos/mtg.webp",
      }),
    ).toBe("/logos/mtg.webp");
  });

  it("uses raster icon when cover missing", () => {
    expect(
      resolveSetVisualUrl({
        coverUrl: "",
        iconUrl: "https://assets.tcgdex.net/en/base/basep/logo",
        fallback: "/logos/pokemon.webp",
      }),
    ).toBe("https://assets.tcgdex.net/en/base/basep/logo");
  });
});
