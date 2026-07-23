import { describe, expect, it } from "vitest";
import { scoreImageMatch } from "../ImageMatchScorer.js";

describe("ImageMatchScorer", () => {
  it("does not auto-link on name alone", () => {
    const r = scoreImageMatch(
      {
        domain: "accessory",
        productName: "Matte Black Sleeves",
        manufacturer: "Other",
      },
      {
        productName: "Matte Black Sleeves",
        manufacturer: "Central",
      },
    );
    expect(r.exclusiveNameOnly || !r.shouldAutoLink).toBe(true);
    expect(r.shouldAutoLink).toBe(false);
  });

  it("auto-links accessory on sku + brand + type", () => {
    const r = scoreImageMatch(
      {
        domain: "accessory",
        manufacturer: "Central",
        brand: "Central",
        sku: "CEN-SLV-001",
        accessoryType: "sleeves",
        productName: "Sleeves Básico",
      },
      {
        manufacturer: "Central",
        brand: "Central",
        sku: "CEN-SLV-001",
        accessoryType: "sleeves",
        productName: "Sleeves Basico Preto",
      },
    );
    expect(r.shouldAutoLink).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0.85);
  });

  it("auto-links sealed on game + expansion + sku", () => {
    const r = scoreImageMatch(
      {
        domain: "sealed",
        game: "MTG",
        expansion: "Final Fantasy",
        productType: "BUNDLE",
        sku: "MTG-FF-BUNDLE",
        publisher: "Wizards of the Coast",
        productName: "Bundle Final Fantasy",
      },
      {
        game: "MTG",
        expansion: "Final Fantasy",
        productType: "BUNDLE",
        sku: "MTG-FF-BUNDLE",
        publisher: "Wizards of the Coast",
        productName: "Bundle — Final Fantasy",
      },
    );
    expect(r.shouldAutoLink).toBe(true);
  });
});
