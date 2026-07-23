import { describe, expect, it } from "vitest";
import {
  ASSET_PACKAGE_KINDS,
  PRODUCT_CONTENT_TYPES,
  PRODUCT_LIFECYCLES,
  SPEC_SCHEMAS,
} from "../../domain/knowledge.js";
import {
  PRODUCT_RELATION_TYPES,
  buildRelationshipTargetKey,
} from "../../domain/relationships.js";
import {
  UNIVERSAL_METADATA_KEYS,
  metadataCompleteness,
} from "../../domain/universalMetadata.js";

describe("Platform V4 — Official Product Contents vocabulary", () => {
  it("defines content types and units for sealed products", () => {
    expect(PRODUCT_CONTENT_TYPES).toContain("booster_pack");
    expect(PRODUCT_CONTENT_TYPES).toContain("decklist");
    expect(PRODUCT_CONTENT_TYPES).toContain("life_wheel");
    expect(PRODUCT_LIFECYCLES).toEqual([
      "ANNOUNCED",
      "PREVIEW",
      "PREORDER",
      "AVAILABLE",
      "LOW_STOCK",
      "OUT_OF_PRINT",
      "DISCONTINUED",
      "HISTORICAL",
    ]);
  });
});

describe("Platform V4 — Specifications schemas", () => {
  it("covers sleeve deckbox playmat booster", () => {
    expect(SPEC_SCHEMAS).toContain("sleeve");
    expect(SPEC_SCHEMAS).toContain("deckbox");
    expect(SPEC_SCHEMAS).toContain("playmat");
    expect(SPEC_SCHEMAS).toContain("booster");
  });
});

describe("Platform V4 — Universal metadata", () => {
  it("scores completeness without AI", () => {
    expect(UNIVERSAL_METADATA_KEYS.length).toBeGreaterThan(20);
    expect(metadataCompleteness({})).toBe(0);
    expect(
      metadataCompleteness({
        publisher: "WOTC",
        game: "MTG",
        sku: "ABC",
        lifecycle: "AVAILABLE",
      }),
    ).toBeGreaterThan(10);
  });
});

describe("Platform V4 — Cross-publisher relationships", () => {
  it("supports game targets and new relation types", () => {
    expect(PRODUCT_RELATION_TYPES).toContain("supports");
    expect(PRODUCT_RELATION_TYPES).toContain("recommended_for");
    expect(PRODUCT_RELATION_TYPES).toContain("compatible_with");
    expect(
      buildRelationshipTargetKey({ toProductId: "p1" }),
    ).toBe("p:p1");
    expect(
      buildRelationshipTargetKey({
        toEntityType: "game",
        toEntityRef: "MTG",
        toGameCode: "MTG",
      }),
    ).toBe("e:game:MTG:MTG");
  });
});

describe("Platform V4 — Universal Asset Package kinds", () => {
  it("includes pdf decklist marketing video slots", () => {
    expect(ASSET_PACKAGE_KINDS).toContain("pdf");
    expect(ASSET_PACKAGE_KINDS).toContain("decklist");
    expect(ASSET_PACKAGE_KINDS).toContain("marketing_kit");
    expect(ASSET_PACKAGE_KINDS).toContain("videos");
    expect(ASSET_PACKAGE_KINDS).toContain("press_kit");
  });
});
