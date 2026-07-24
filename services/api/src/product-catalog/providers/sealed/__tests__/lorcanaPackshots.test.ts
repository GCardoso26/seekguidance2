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

  it("maps curated Illumineer's Trove packshots", () => {
    expect(packshotUrlForSku("LOR-TROVE-ARI")).toBe(
      "https://ravensburger.cloud/images/produktseiten/600x600/11098509.webp",
    );
    expect(packshotUrlForSku("LOR-TROVE-ATV")).toContain("11090060");
    expect(packshotUrlForSku("LOR-BOX-ATV")).toContain("11090046");
    expect(packshotUrlForSku("LOR-BOX-ROF")).toContain("11098271");
  });

  it("does not invent Quest / unknown SKUs", () => {
    expect(packshotUrlForSku("LOR-BOX-QU1")).toBeUndefined();
    expect(packshotUrlForSku("LOR-TROVE-QU1")).toBeUndefined();
    expect(packshotUrlForSku("LOR-PACK-ARI")).toBeUndefined();
    expect(packshotUrlForSku("LOR-BOX-ZZZ")).toBeUndefined();
  });

  it("loads BOX + TROVE curated entries", () => {
    expect(loadLorcanaPackshotBySku().size).toBeGreaterThanOrEqual(24);
  });
});
