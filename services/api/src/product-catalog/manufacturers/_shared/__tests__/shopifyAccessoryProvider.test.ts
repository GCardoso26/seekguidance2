import { describe, expect, it } from "vitest";
import { ProductCategory } from "../../../domain/enums.js";
import { mapShopifyTypeToCategory } from "../shopifyAccessoryProvider.js";

describe("mapShopifyTypeToCategory", () => {
  it("maps common accessory product types", () => {
    expect(mapShopifyTypeToCategory("Deck Protectors", "Matte Black")).toEqual({
      category: ProductCategory.SLEEVES,
      accessoryType: "sleeves",
    });
    expect(mapShopifyTypeToCategory("Playmat", "Neoprene XL")).toEqual({
      category: ProductCategory.PLAYMAT,
      accessoryType: "playmat",
    });
    expect(mapShopifyTypeToCategory("Deck Boxes", "Dual Deck")).toEqual({
      category: ProductCategory.DECK_BOX,
      accessoryType: "deck_box",
    });
  });

  it("skips apparel", () => {
    expect(mapShopifyTypeToCategory("Apparel", "Logo Hoodie")).toBeNull();
  });
});
