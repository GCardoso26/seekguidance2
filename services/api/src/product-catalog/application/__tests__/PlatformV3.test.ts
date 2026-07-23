import { describe, expect, it } from "vitest";
import { PRODUCT_RELATION_TYPES } from "../../domain/relationships.js";
import { computeAssetHealthScore } from "../AssetHealth.js";
import { SOURCE_TRUST_V2, inferSourceType, shouldReplaceOfficialAsset } from "../SourceTrust.js";
import { emptyAssetPackage } from "../../publishers/_shared/PublisherAssetPackage.js";

describe("Product Relationship types", () => {
  it("includes official relation vocabulary", () => {
    expect(PRODUCT_RELATION_TYPES).toContain("contains");
    expect(PRODUCT_RELATION_TYPES).toContain("accessory_for");
    expect(PRODUCT_RELATION_TYPES).toContain("recommended_with");
    expect(PRODUCT_RELATION_TYPES).toContain("included_by");
  });
});

describe("Asset Health score", () => {
  it("returns 0–100 weighted score", () => {
    const allOk = Object.fromEntries(
      [
        "original",
        "thumb",
        "hero",
        "gallery",
        "webp",
        "avif",
        "jpeg",
        "blur",
        "lqip",
        "responsive",
        "cdn",
        "metadata",
        "alt",
        "hash",
        "width",
        "height",
        "aspectRatio",
        "crop",
        "background",
        "verifiedSource",
        "sourceTrust",
        "versionHistory",
        "qualityScore",
      ].map((k) => [k, true]),
    );
    const full = computeAssetHealthScore(allOk);
    expect(full.scorePct).toBe(100);
    const empty = computeAssetHealthScore({});
    expect(empty.scorePct).toBe(0);
    expect(full.components.length).toBeGreaterThan(10);
  });
});

describe("Source Trust V2", () => {
  it("orders hierarchy and protects seller uploads", () => {
    expect(SOURCE_TRUST_V2.publisher_api).toBe(100);
    expect(SOURCE_TRUST_V2.publisher_cdn).toBe(95);
    expect(SOURCE_TRUST_V2.official_manufacturer).toBe(85);
    expect(SOURCE_TRUST_V2.community_verified).toBe(50);
    expect(inferSourceType("gamegenic-sleeves")).toBe("official_manufacturer");
    expect(
      shouldReplaceOfficialAsset({
        existingPriority: 95,
        incomingPriority: 60,
        existingEntityType: "product_variant",
      }),
    ).toBe(false);
    expect(
      shouldReplaceOfficialAsset({
        existingPriority: 20,
        incomingPriority: 100,
        existingEntityType: "store_product",
      }),
    ).toBe(false);
  });
});

describe("PublisherAssetPackage", () => {
  it("builds empty universal package", () => {
    const pkg = emptyAssetPackage("Wizards", { game: "MTG", expansion: "Final Fantasy" });
    expect(pkg.publisher).toBe("Wizards");
    expect(pkg.game).toBe("MTG");
    expect(pkg.assets).toBeDefined();
    expect(pkg.relationships).toEqual([]);
  });
});
