import { describe, expect, it } from "vitest";
import { buildDerivativeSet, buildDerivativeUrl } from "../derivativeUrls.js";

describe("CDN derivatives", () => {
  it("gera URLs thumb/md/lg", () => {
    const base = "https://cdn.example.com/assets/ab/cd.webp";
    expect(buildDerivativeUrl(base, "medium")).toBe(
      "https://cdn.example.com/assets/ab/cd_md.webp",
    );
    const set = buildDerivativeSet(base);
    expect(set.original).toBe(base);
    expect(set.thumb).toContain("_thumb");
  });
});
