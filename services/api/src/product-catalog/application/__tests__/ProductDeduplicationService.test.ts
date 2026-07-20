import { describe, expect, it } from "vitest";
import { productDeduplicationService } from "../ProductDeduplicationService.js";

describe("ProductDeduplicationService", () => {
  it("prioriza SKU sobre EAN e título", () => {
    const lookups = {
      bySku: new Map([["SKU-1", "p-sku"]]),
      byEan: new Map([["789", "p-ean"]]),
      byNormalizedTitle: new Map([["booster box teste", "p-title"]]),
      byImageHash: new Map(),
    };
    const r = productDeduplicationService.resolveProduct(
      { sku: "SKU-1", ean: "789", titlePt: "Booster Box Teste" },
      lookups,
    );
    expect(r.strategy).toBe("sku");
    expect(r.existingProductId).toBe("p-sku");
  });

  it("usa título normalizado quando SKU/EAN ausentes", () => {
    const lookups = {
      bySku: new Map(),
      byEan: new Map(),
      byNormalizedTitle: new Map([["dragon shield matte", "p-1"]]),
      byImageHash: new Map(),
    };
    const r = productDeduplicationService.resolveProduct({ titlePt: "Dragon Shield — Matte" }, lookups);
    expect(r.strategy).toBe("normalized_title");
    expect(r.existingProductId).toBe("p-1");
  });

  it("usa fingerprint de variante após EAN", () => {
    const r = productDeduplicationService.resolveVariant(
      "p-1",
      { variantName: "Preto", fingerprint: "dragonshield|matte|black" },
      {
        bySku: new Map(),
        byEan: new Map(),
        byFingerprint: new Map([["dragonshield|matte|black", "v-1"]]),
        byProductAndName: new Map(),
      },
    );
    expect(r.strategy).toBe("fingerprint");
    expect(r.existingVariantId).toBe("v-1");
  });
});
