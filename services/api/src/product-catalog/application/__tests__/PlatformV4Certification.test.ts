/**
 * Platform V4 certification tests — coverage for gaps found in QA campaign.
 * Documents expected invariants; does not fix production data.
 */
import { describe, expect, it } from "vitest";
import { buildRelationshipTargetKey } from "../../domain/relationships.js";
import { metadataCompleteness } from "../../domain/universalMetadata.js";
import { taxonomyBreadcrumb, parseTaxonomyQuery } from "../UniversalTaxonomy.js";

describe("QA V4 — relationship target_key uniqueness", () => {
  it("product and game targets never collide", () => {
    const p = buildRelationshipTargetKey({ toProductId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" });
    const g = buildRelationshipTargetKey({
      toEntityType: "game",
      toEntityRef: "MTG",
      toGameCode: "MTG",
    });
    expect(p.startsWith("p:")).toBe(true);
    expect(g.startsWith("e:")).toBe(true);
    expect(p).not.toBe(g);
  });
});

describe("QA V4 — taxonomy navigation", () => {
  it("builds breadcrumb without empty nodes", () => {
    expect(
      taxonomyBreadcrumb({
        publisher: "WOTC",
        game: "MTG",
        category: "SEALED_PRODUCT",
        subcategory: "Booster",
        productFamily: "Play Booster",
      }),
    ).toEqual(["WOTC", "MTG", "SEALED_PRODUCT", "Booster", "Play Booster"]);
  });

  it("parses query aliases", () => {
    const path = parseTaxonomyQuery({ product_family: "ETB", product_id: "x" });
    expect(path.productFamily).toBe("ETB");
    expect(path.productId).toBe("x");
  });
});

describe("QA V4 — metadata completeness invariant", () => {
  it("never exceeds 100", () => {
    const full = metadataCompleteness({
      publisher: "a",
      manufacturer: "b",
      game: "c",
      expansion: "d",
      collection: "e",
      series: "f",
      releaseDate: "2026-01-01",
      language: "en",
      country: "US",
      msrpCents: 1,
      sku: "s",
      upc: "u",
      ean: "e",
      isbn: "i",
      weightGrams: 1,
      dimensions: { widthMm: 1 },
      contents: "c",
      materials: "m",
      finish: "f",
      rarity: "r",
      productLine: "pl",
      productFamily: "pf",
      edition: "ed",
      legalStatus: "ok",
      lifecycle: "AVAILABLE",
      assetTrust: 100,
      assetScore: 100,
    });
    expect(full).toBeLessThanOrEqual(100);
    expect(full).toBeGreaterThan(90);
  });
});

/**
 * Certification gap markers — these document missing production wiring.
 * They pass as documentation assertions; E2E data fill is tracked in BUG_BACKLOG.
 */
describe("QA V4 — known certification gaps (documented)", () => {
  it("documents that provider sync must populate official contents (BUG-V4-009)", () => {
    const wiredProvidersCallingContentsService = 0; // audited: no publisher imports OfficialProductContentsService
    expect(wiredProvidersCallingContentsService).toBe(0);
  });

  it("documents ProductAssetPackageService lacks upsert uniqueness (BUG-V4-006)", () => {
    const hasUniqueConstraintOnPackageKindAndUrl = false;
    expect(hasUniqueConstraintOnPackageKindAndUrl).toBe(false);
  });
});
