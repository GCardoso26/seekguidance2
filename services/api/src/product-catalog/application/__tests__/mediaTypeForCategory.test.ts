import { describe, expect, it } from "vitest";
import { mediaTypeForCategory } from "../mediaTypeForCategory.js";
import { ProductCategory } from "../../domain/enums.js";

describe("mediaTypeForCategory", () => {
  it("maps sealed and accessory categories", () => {
    expect(mediaTypeForCategory(ProductCategory.SEALED_PRODUCT)).toBe("SEALED_PRODUCT");
    expect(mediaTypeForCategory(ProductCategory.SEALED_PRODUCT, "gallery")).toBe("SEALED_GALLERY");
    expect(mediaTypeForCategory(ProductCategory.SLEEVES)).toBe("ACCESSORY");
    expect(mediaTypeForCategory(ProductCategory.PLAYMAT, "lifestyle")).toBe("ACCESSORY_LIFESTYLE");
  });
});
