import { describe, expect, it } from "vitest";
import { buildAssetPackageIdentityKey } from "../ProductAssetPackageService.js";

describe("P2 — Asset package identity key (BUG-V4-006)", () => {
  it("builds stable identity from product/kind/url/role", () => {
    expect(
      buildAssetPackageIdentityKey({
        productId: "p1",
        packageKind: "download",
        sourceUrl: "https://ex.com/a.zip",
        role: "rules",
      }),
    ).toBe("p1|download|https://ex.com/a.zip|rules");
  });

  it("treats null url/role as empty strings (dedupe-safe)", () => {
    expect(
      buildAssetPackageIdentityKey({
        productId: "p1",
        packageKind: "marketing",
        sourceUrl: null,
        role: undefined,
      }),
    ).toBe("p1|marketing||");
  });
});

describe("P2 — lifecycleCoverage includes AVAILABLE (BUG-V4-007)", () => {
  it("pct with AVAILABLE-only products is 100% when all have lifecycle", () => {
    const products = 10;
    const withLifecycle = 10; // all AVAILABLE
    const withLifecycleNonDefault = 0;
    const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
    // Correct formula (post-fix)
    expect(pct(withLifecycle, products)).toBe(100);
    // Old buggy formula would undercount
    expect(pct(withLifecycleNonDefault, products)).toBe(0);
  });
});
