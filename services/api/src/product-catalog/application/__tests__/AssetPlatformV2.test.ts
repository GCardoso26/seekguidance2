import { describe, expect, it } from "vitest";
import { computeAssetQualityScore, inferQualitySignals } from "../AssetQualityScore.js";
import { explainImageMatch } from "../ExplainableMatching.js";
import {
  inferSourceType,
  shouldReplaceOfficialAsset,
  sourcePriority,
  SOURCE_TRUST,
} from "../SourceTrust.js";
import { mapManufacturerManifest } from "../../manufacturers/_shared/mapManifest.js";
import type { ManufacturerManifest } from "../../manufacturers/_shared/types.js";
import { mapSetImagesToExpansionAssets } from "../../publishers/_shared/expansionAssets.js";

describe("AssetQualityScore", () => {
  it("scores 0–100 from weighted signals", () => {
    const r = computeAssetQualityScore(
      inferQualitySignals({
        role: "primary",
        alt: "Sleeves",
        cdnUrl: "https://cdn.example/a.webp",
        blurhash: "LKO2?U",
        width: 800,
        height: 800,
        derivatives: { webp: {}, avif: {}, jpeg: {}, _meta: { lqip: "data:..." } },
        mediaType: "ACCESSORY",
      }),
    );
    expect(r.score).toBeGreaterThan(50);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("ExplainableMatching", () => {
  it("returns explanation and rejects name-only", () => {
    const r = explainImageMatch(
      { domain: "accessory", productName: "Sleeves Black", manufacturer: "A" },
      { productName: "Sleeves Black", manufacturer: "B" },
    );
    expect(r.decision).not.toBe("auto_link");
    expect(r.confidencePct).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(r.explanation)).toBe(true);
    expect(r.threshold).toBe(0.85);
  });

  it("auto-links with strong identity signals", () => {
    const r = explainImageMatch(
      {
        domain: "sealed",
        game: "MTG",
        expansion: "Final Fantasy",
        productType: "BUNDLE",
        sku: "MTG-FF-B",
        publisher: "WotC",
        productName: "Bundle Final Fantasy",
      },
      {
        game: "MTG",
        expansion: "Final Fantasy",
        productType: "BUNDLE",
        sku: "MTG-FF-B",
        publisher: "WotC",
        productName: "Bundle Final Fantasy",
      },
    );
    expect(r.decision).toBe("auto_link");
    expect(r.explanation.some((e) => e.signal === "sku")).toBe(true);
  });
});

describe("SourceTrust", () => {
  it("orders publisher API above liga and never replaces seller upload", () => {
    expect(SOURCE_TRUST.publisher_api).toBeGreaterThan(SOURCE_TRUST.liga_portal);
    expect(inferSourceType("scryfall-sealed")).toBe("publisher_api");
    expect(inferSourceType("liga-public-image-fallback")).toBe("liga_portal");
    expect(sourcePriority("official_manifest")).toBe(80);
    expect(
      shouldReplaceOfficialAsset({
        existingPriority: 60,
        incomingPriority: 100,
        existingEntityType: "product_variant",
      }),
    ).toBe(true);
    expect(
      shouldReplaceOfficialAsset({
        existingPriority: 20,
        incomingPriority: 100,
        existingEntityType: "store_product",
      }),
    ).toBe(false);
  });
});

describe("Manufacturer mapping", () => {
  it("never sets game on accessories", () => {
    const manifest: ManufacturerManifest = {
      version: 1,
      manufacturerId: "test",
      manufacturer: "Test Co",
      brand: "Test",
      items: [
        {
          sku: "T-1",
          titlePt: "Sleeves",
          accessoryType: "sleeves",
          images: [{ role: "packshot", sourceUrl: "https://example.com/a.webp", isPrimary: true }],
        },
      ],
    };
    const items = mapManufacturerManifest(manifest);
    expect(items[0]!.gameCodes).toEqual([]);
    expect(items[0]!.game).toBeUndefined();
  });
});

describe("Expansion assets", () => {
  it("maps logo/banner/hero roles", () => {
    const assets = mapSetImagesToExpansionAssets({
      game: "MTG",
      providerId: "magic-expansion-assets",
      code: "fin",
      name: "Final Fantasy",
      logo: "https://example.com/logo.svg",
      banner: "https://example.com/banner.jpg",
      hero: "https://example.com/hero.jpg",
      icon: "https://example.com/icon.svg",
    });
    expect(assets.map((a) => a.role).sort()).toEqual(["banner", "hero", "icon", "logo"].sort());
  });
});
