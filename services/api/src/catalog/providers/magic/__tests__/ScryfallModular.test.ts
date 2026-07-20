import { describe, expect, it } from "vitest";
import { getGameConfig } from "../../gameConfigRegistry.js";
import { resolveScryfallImageUrl } from "../ImageResolver.js";
import { mapCard, mapVariants } from "../MetadataMapper.js";
import type { ScryfallCard } from "../types.js";

const sample: ScryfallCard = {
  id: "sol-ring-id",
  name: "Sol Ring",
  set: "c21",
  collector_number: "263",
  rarity: "uncommon",
  lang: "en",
  finishes: ["nonfoil", "foil"],
  foil: true,
  nonfoil: true,
  image_uris: { normal: "https://example.com/sol.png" },
  legalities: { commander: "legal", modern: "not_legal" },
};

describe("MTG MetadataMapper", () => {
  it("mapCard preserva finishes em gameData", () => {
    const dto = mapCard(sample);
    expect(dto.providerCardId).toBe("sol-ring-id");
    expect(dto.normalizedName).toBe("sol ring");
    expect(dto.imageUrl).toContain("sol.png");
    expect((dto.gameData as { finishes: string[] }).finishes).toEqual(["nonfoil", "foil"]);
  });

  it("mapVariants deriva finishes reais", () => {
    const variants = mapVariants(sample);
    expect(variants).toHaveLength(2);
    expect(variants.map((v) => v.finish)).toEqual(["nonfoil", "foil"]);
    expect(variants.find((v) => v.finish === "foil")?.isFoil).toBe(true);
  });

  it("mapVariants fallback sem finishes", () => {
    const variants = mapVariants({
      ...sample,
      finishes: undefined,
      foil: true,
      nonfoil: true,
    });
    expect(variants.length).toBeGreaterThanOrEqual(1);
  });
});

describe("MTG ImageResolver", () => {
  it("resolveScryfallImageUrl usa card_faces quando necessário", () => {
    const url = resolveScryfallImageUrl({
      id: "dfc",
      name: "DFC",
      set: "mid",
      card_faces: [{ image_uris: { normal: "https://example.com/face.png" } }],
    });
    expect(url).toBe("https://example.com/face.png");
  });
});

describe("MTG GameConfig", () => {
  it("expõe rarities, formats e synonyms", () => {
    const cfg = getGameConfig("MTG");
    expect(cfg?.rarities.some((r) => r.value === "mythic")).toBe(true);
    expect(cfg?.formats.some((f) => f.value === "commander")).toBe(true);
    expect(cfg?.searchSynonyms.bolt).toContain("lightning bolt");
    expect(cfg?.finishes.some((f) => f.value === "etched")).toBe(true);
  });
});
