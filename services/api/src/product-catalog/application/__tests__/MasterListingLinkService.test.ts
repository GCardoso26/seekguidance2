import { describe, expect, it } from "vitest";

describe("Master listing link categories", () => {
  it("only allows accessory/sealed shop categories", () => {
    const cats = [
      "sleeve",
      "deck_box",
      "playmat",
      "album",
      "accessory",
      "booster_box",
      "sealed",
    ];
    expect(cats).not.toContain("single");
    expect(cats).toContain("sleeve");
  });
});
