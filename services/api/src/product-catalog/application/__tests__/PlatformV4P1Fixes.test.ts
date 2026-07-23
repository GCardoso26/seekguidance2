import { describe, expect, it } from "vitest";
import { computeKnowledgeAffinityBoosts } from "../../search/knowledgeAffinityBoosts.js";
import { mapManufacturerManifest } from "../../manufacturers/_shared/mapManifest.js";
import type { ManufacturerManifest } from "../../manufacturers/_shared/types.js";
import { ProductCategory } from "../../domain/enums.js";

describe("P1 — Search knowledge affinity boosts (BUG-V4-011)", () => {
  it("boosts same collection/publisher/lifecycle as secondary only", () => {
    const matched = ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"];
    const rows = [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        collection_id: "cccccccccccccccc-cccc-cccc-cccc-cccccccccccc",
        publisher_id: "pppppppp-pppp-pppp-pppp-pppppppppppp",
        game: "MTG",
        lifecycle: "AVAILABLE",
        expansion: "Final Fantasy",
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        collection_id: "cccccccccccccccc-cccc-cccc-cccc-cccccccccccc",
        publisher_id: "pppppppp-pppp-pppp-pppp-pppppppppppp",
        game: "MTG",
        lifecycle: "AVAILABLE",
        expansion: "Final Fantasy",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        collection_id: null,
        publisher_id: null,
        game: "POKEMON",
        lifecycle: "HISTORICAL",
        expansion: null,
      },
    ];
    const boosts = computeKnowledgeAffinityBoosts(matched, rows);
    expect(boosts.get("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")).toBeCloseTo(0.095, 5);
    expect(boosts.has("dddddddd-dddd-dddd-dddd-dddddddddddd")).toBe(false);
    expect(boosts.has(matched[0])).toBe(false);
    expect(boosts.get("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")!).toBeLessThan(0.2);
  });
});

describe("P1 — Official knowledge wiring from manifest (BUG-V4-009)", () => {
  it("maps official contents/specs/metadata into DTO", () => {
    const manifest: ManufacturerManifest = {
      version: 1,
      manufacturerId: "gamegenic",
      manufacturer: "Gamegenic",
      brand: "Gamegenic",
      items: [
        {
          sku: "GG-S-1",
          titlePt: "Sleeves",
          accessoryType: "sleeves",
          images: [{ role: "packshot", sourceUrl: "https://example.com/a.webp", isPrimary: true }],
          officialContents: [{ contentType: "sleeve", label: "Sleeves", quantity: 100, unit: "pcs" }],
          specifications: { specSchema: "sleeve", widthMm: 66, heightMm: 91, pieces: 100, pvcFree: true },
          officialMetadata: { productFamily: "Sleeves", lifecycle: "AVAILABLE" },
        },
      ],
    };
    const dtos = mapManufacturerManifest(manifest, ProductCategory.SLEEVES);
    expect(dtos).toHaveLength(1);
    expect(dtos[0].officialContents?.[0].quantity).toBe(100);
    expect(dtos[0].specifications?.specSchema).toBe("sleeve");
    expect(dtos[0].officialMetadata?.manufacturer).toBe("Gamegenic");
    expect(dtos[0].officialMetadata?.lifecycle).toBe("AVAILABLE");
  });
});
