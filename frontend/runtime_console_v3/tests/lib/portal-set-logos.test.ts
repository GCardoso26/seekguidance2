import { describe, expect, it } from "vitest";
import {
  LORCANA_FEATURED_SET_CODES,
  setLogoPublicPath,
  gameHasSetLogos,
} from "@/lib/portal-set-logos";
import { pickMasterCatalogImage } from "@/lib/portal-category-images";
import type { MasterCatalogSearchItem } from "@/hooks/useMasterProductCatalog";

describe("portal-set-logos", () => {
  it("maps Lorcana set codes to public logo paths", () => {
    expect(setLogoPublicPath("LORCANA", "WIN")).toBe("/logos/sets/lorcana/lor11.svg");
    expect(setLogoPublicPath("LORCANA", "WUN")).toBe("/logos/sets/lorcana/lor12.svg");
    expect(setLogoPublicPath("LORCANA", "ATV")).toBe("/logos/sets/lorcana/lor13.svg");
  });

  it("returns null for games without set logo assets", () => {
    expect(gameHasSetLogos("POKEMON")).toBe(false);
    expect(setLogoPublicPath("POKEMON", "SV1")).toBeNull();
  });

  it("features the three latest Lorcana chapters", () => {
    expect(LORCANA_FEATURED_SET_CODES).toEqual(["WIN", "WUN", "ATV"]);
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
