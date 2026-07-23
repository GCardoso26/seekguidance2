import { describe, expect, it } from "vitest";
import {
  getCategoriesForGame,
  categoryLabel,
  marketplaceCategoryHref,
  PRODUCT_CATEGORY_META,
} from "@/lib/tcg-product-categories";

describe("tcg-product-categories", () => {
  it("returns Lorcana categories from CardTrader reference", () => {
    const cats = getCategoriesForGame("LORCANA");
    expect(cats.map((c) => c.id)).toContain("booster_box");
    expect(cats.map((c) => c.id)).toContain("album");
    expect(cats.map((c) => c.id)).toContain("single");
  });

  it("returns Sorcery categories including sleeves and playmats", () => {
    const cats = getCategoriesForGame("SORCERY");
    expect(cats.map((c) => c.id)).toContain("sleeve");
    expect(cats.map((c) => c.id)).toContain("playmat");
  });

  it("provides image URL for each category", () => {
    for (const meta of Object.values(PRODUCT_CATEGORY_META)) {
      expect(meta.imageUrl).toMatch(/^\/images\/product-types\/.+\.svg$/);
    }
  });

  it("builds marketplace href with game and category on /marketplace/produtos", () => {
    const href = marketplaceCategoryHref("lorcana", "booster_box");
    expect(href.startsWith("/marketplace/produtos?")).toBe(true);
    expect(href).toContain("game_id=LORCANA");
    expect(href).toContain("category=booster_box");
  });

  it("labels categories in Portuguese", () => {
    expect(categoryLabel("album")).toBe("Pastas / Albums");
    expect(categoryLabel("booster_box")).toBe("Booster Boxes");
  });
});
