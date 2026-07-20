import { describe, expect, it } from "vitest";
import { computeQualityScore } from "../qualityScore.js";

describe("computeQualityScore", () => {
  it("soma pesos quando campos presentes", () => {
    const full = computeQualityScore({
      hasDescription: true,
      hasImages: true,
      hasAttributes: true,
      hasEan: true,
      hasSku: true,
      hasCollection: true,
      hasManufacturer: true,
      hasTranslations: true,
    });
    expect(full.score).toBe(100);
  });

  it("penaliza produto incompleto", () => {
    const poor = computeQualityScore({
      hasDescription: false,
      hasImages: false,
      hasAttributes: false,
      hasEan: false,
      hasSku: true,
      hasCollection: false,
      hasManufacturer: false,
      hasTranslations: false,
    });
    expect(poor.score).toBe(10);
  });
});
