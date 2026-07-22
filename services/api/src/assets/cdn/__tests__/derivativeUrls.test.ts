import { describe, expect, it } from "vitest";
import {
  buildDerivativeSet,
  buildDerivativeUrl,
  buildFormatDerivativeMap,
  buildFormatUrl,
  pickSafeDerivativeSize,
} from "../derivativeUrls.js";

describe("CDN derivatives V2", () => {
  it("gera URLs thumb/md/lg/full", () => {
    const base = "https://cdn.example.com/assets/ab/cd.webp";
    expect(buildDerivativeUrl(base, "medium")).toBe(
      "https://cdn.example.com/assets/ab/cd_md.webp",
    );
    const set = buildDerivativeSet(base);
    expect(set.original).toBe(base);
    expect(set.thumb).toContain("_thumb");
    expect(set.full).toContain("_full");
  });

  it("gera mapa size×format (avif/webp/jpeg)", () => {
    const map = buildFormatDerivativeMap("https://cdn.example.com/x.webp");
    expect(map["medium.avif"]?.mime).toBe("image/avif");
    expect(map["large.webp"]?.url).toContain("_lg");
    expect(buildFormatUrl("https://cdn.example.com/x.webp", "avif")).toContain(".avif");
  });

  it("nunca upscale — clampa para largura da fonte", () => {
    expect(pickSafeDerivativeSize("full", 200)).toBe("thumb");
    expect(pickSafeDerivativeSize("large", 500)).toBe("medium");
    expect(pickSafeDerivativeSize("medium", 2000)).toBe("medium");
  });
});
