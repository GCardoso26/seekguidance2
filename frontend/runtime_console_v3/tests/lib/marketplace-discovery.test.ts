import { describe, expect, it } from "vitest";
import {
  getAllDiscoveryTiles,
  getDiscoveryCategoryTiles,
  getDiscoveryCollectionTiles,
  getDiscoveryLaunchTiles,
} from "@/lib/marketplace-discovery";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("marketplace-discovery curation", () => {
  it("exposes category hubs with prefiltered hrefs", () => {
    const cats = getDiscoveryCategoryTiles();
    expect(cats).toHaveLength(3);
    expect(cats.map((c) => c.href)).toEqual(["/loja/singles", "/loja/selados", "/loja/acessorios"]);
    for (const c of cats) {
      expect(c.imageUrl.length).toBeGreaterThan(0);
      expect(c.rail).toBe("categories");
    }
  });

  it("collections and launches link to real destinations without prices", () => {
    const tiles = [...getDiscoveryCollectionTiles(), ...getDiscoveryLaunchTiles()];
    expect(tiles.length).toBeGreaterThanOrEqual(6);
    for (const t of tiles) {
      expect(t.href.startsWith("/")).toBe(true);
      expect(t.href).not.toMatch(/price|estoque|stock/i);
      expect(t.imageUrl.length).toBeGreaterThan(0);
      expect(["collections", "launches"]).toContain(t.rail);
    }
  });

  it("all discovery tiles have unique ids", () => {
    const ids = getAllDiscoveryTiles().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("loja busca theme quarantine", () => {
  it("does not wrap search in MarketplaceGameSkin", () => {
    const pagePath = join(process.cwd(), "src/app/loja/busca/page.tsx");
    const src = readFileSync(pagePath, "utf8");
    expect(src.includes("<MarketplaceGameSkin")).toBe(false);
    expect(src.includes("experience/MarketplaceGameSkin")).toBe(false);
    expect(src.includes("GameTaxonomyChip")).toBe(true);
  });

  it("MarketplaceGameSkin is a passthrough (no skin runtime)", () => {
    const skinPath = join(process.cwd(), "src/components/experience/MarketplaceGameSkin.tsx");
    const src = readFileSync(skinPath, "utf8");
    expect(src.includes('className="game-portal')).toBe(false);
    expect(src.includes("data-mood=")).toBe(false);
    expect(src.includes("gameThemeCssVars(")).toBe(false);
    expect(src.includes("return <>{children}</>")).toBe(true);
  });
});
