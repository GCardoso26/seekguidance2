import { describe, expect, it } from "vitest";
import {
  LORCANA_FEATURED_SET_CODES,
  LORCANA_HERO_BANNER_PATHS,
  portalHeroBannerPaths,
  setLogoPublicPath,
  gameHasSetLogos,
} from "@/lib/portal-set-logos";
import { pickMasterCatalogImage } from "@/lib/portal-category-images";
import type { MasterCatalogSearchItem } from "@/hooks/useMasterProductCatalog";
import { IMPLEMENTATION_WAVE_GAME_IDS } from "@/lib/game-rollout";
import { isProductEcosystemDenied } from "@/lib/product-game-allowlist";

describe("portal-set-logos", () => {
  it("maps Lorcana set codes to public AVIF key-art paths", () => {
    expect(setLogoPublicPath("LORCANA", "WIN")).toBe("/logos/sets/lorcana/lor11.avif");
    expect(setLogoPublicPath("LORCANA", "WUN")).toBe("/logos/sets/lorcana/lor12.avif");
    expect(setLogoPublicPath("LORCANA", "ATV")).toBe("/logos/sets/lorcana/lor13.avif");
    expect(setLogoPublicPath("LORCANA", "AOV")).toBe("/logos/sets/lorcana/lor13.avif");
    expect(setLogoPublicPath("LORCANA", "TFC")).toBe("/logos/sets/lorcana/lor1.avif");
    expect(setLogoPublicPath("LORCANA", "ROF")).toBeNull();
  });

  it("exposes portal hero banner paths for all wave games", () => {
    expect(portalHeroBannerPaths("LORCANA")).toEqual([...LORCANA_HERO_BANNER_PATHS]);
    for (const gameId of IMPLEMENTATION_WAVE_GAME_IDS) {
      if (isProductEcosystemDenied(gameId)) continue;
      const paths = portalHeroBannerPaths(gameId);
      expect(paths, gameId).toHaveLength(3);
      for (const p of paths) {
        expect(p.startsWith("/logos/sets/")).toBe(true);
      }
    }
  });

  it("returns null for games without set logo assets", () => {
    expect(gameHasSetLogos("POKEMON")).toBe(false);
    expect(setLogoPublicPath("POKEMON", "SV1")).toBeNull();
  });

  it("features the three latest Lorcana chapters", () => {
    expect(LORCANA_FEATURED_SET_CODES).toEqual(["WIN", "WUN", "AOV"]);
  });
});

describe("portal-category-images", () => {
  const items: MasterCatalogSearchItem[] = [
    {
      product_id: "1",
      title_pt: "Booster Box — Winterspell",
      category: "SEALED_PRODUCT",
      subcategory: "BOOSTER_BOX",
      game: "LORCANA",
      sku: "LOR-BOX-WIN",
      variant_id: "v1",
      variant_name: "Padrão",
      image_url: "https://ravensburger.cloud/images/produktseiten/600x600/11090016.webp",
    },
  ];

  it("picks master catalog image by subcategory", () => {
    expect(pickMasterCatalogImage(items, "booster_box")).toContain("ravensburger.cloud");
    expect(pickMasterCatalogImage(items, "booster")).toBeNull();
  });
});
