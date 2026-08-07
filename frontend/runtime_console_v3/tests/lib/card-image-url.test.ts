import { describe, expect, it } from "vitest";
import {
  cardImageUrl,
  isExternalCardImageUrl,
  normalizeTcgdexImageUrl,
  shouldBypassImageOptimizer,
} from "@/lib/format-currency";

describe("card image helpers", () => {
  it("detecta URLs externas de CDN", () => {
    expect(
      isExternalCardImageUrl(
        "https://api.lorcana.ravensburger.com/images/en/set12/6_abc.jpg",
      ),
    ).toBe(true);
    expect(isExternalCardImageUrl("/logos/default-tcg.svg")).toBe(false);
    expect(isExternalCardImageUrl("data:image/svg+xml,...")).toBe(false);
  });

  it("bypassa otimizador para CDNs e SVG", () => {
    expect(
      shouldBypassImageOptimizer(
        "https://api.lorcana.ravensburger.com/images/en/set12/6_abc.jpg",
      ),
    ).toBe(true);
    expect(shouldBypassImageOptimizer("/logos/mtg.svg")).toBe(true);
    expect(shouldBypassImageOptimizer("/images/local.png")).toBe(false);
  });

  it("usa placeholder quando imagem ausente", () => {
    expect(cardImageUrl({})).toBe("/logos/default-tcg.svg");
  });

  it("reescreve URLs Sorcery com host quebrado para CloudFront", () => {
    expect(
      cardImageUrl({
        image_uris: {
          normal: "https://cards.sorcerytcg.com/art-13_treasures_of_britain-b-s.jpg",
        },
      }),
    ).toBe("https://d27a44hjr9gen3.cloudfront.net/art/13_treasures_of_britain_b_s.png");
  });

  it("normaliza base TCGdex para /high.webp", () => {
    expect(normalizeTcgdexImageUrl("https://assets.tcgdex.net/en/xy/xy8/40")).toBe(
      "https://assets.tcgdex.net/en/xy/xy8/40/high.webp",
    );
    expect(normalizeTcgdexImageUrl("https://assets.tcgdex.net/en/tcgp/A3/112/")).toBe(
      "https://assets.tcgdex.net/en/tcgp/A3/112/high.webp",
    );
    const already = "https://assets.tcgdex.net/en/xy/xy8/40/high.webp";
    expect(normalizeTcgdexImageUrl(already)).toBe(already);
    expect(normalizeTcgdexImageUrl("https://images.pokemontcg.io/xy8/40")).toBe(
      "https://images.pokemontcg.io/xy8/40",
    );
  });

  it("aplica normalização TCGdex em cardImageUrl", () => {
    expect(
      cardImageUrl({
        image_url: "https://assets.tcgdex.net/en/xy/xy8/40",
      }),
    ).toBe("https://assets.tcgdex.net/en/xy/xy8/40/high.webp");
  });
});
