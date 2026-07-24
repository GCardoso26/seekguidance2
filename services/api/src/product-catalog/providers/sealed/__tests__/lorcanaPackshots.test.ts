import { describe, expect, it, beforeEach } from "vitest";
import {
  loadLorcanaPackshotBySku,
  packshotUrlForSku,
  resetLorcanaPackshotCache,
} from "../lorcanaPackshots.js";

describe("lorcanaPackshots", () => {
  beforeEach(() => resetLorcanaPackshotCache());

  it("maps beachhead booster SKUs to ravensburger.cloud HTTPS packshots", () => {
    expect(packshotUrlForSku("LOR-BOX-ARI")).toBe(
      "https://ravensburger.cloud/images/produktseiten/600x600/11098557.webp",
    );
    expect(packshotUrlForSku("lor-box-whi")).toContain("ravensburger.cloud");
    expect(packshotUrlForSku("LOR-BOX-WHI")).toMatch(/^https:\/\//);
  });

  it("does not invent trove or missing-set packshots", () => {
    expect(packshotUrlForSku("LOR-TROVE-ARI")).toBeUndefined();
    expect(packshotUrlForSku("LOR-BOX-ROF")).toBeUndefined();
    expect(packshotUrlForSku("LOR-BOX-QU1")).toBeUndefined();
  });

  it("loads a non-empty curated set", () => {
    expect(loadLorcanaPackshotBySku().size).toBeGreaterThanOrEqual(10);
  });
});
