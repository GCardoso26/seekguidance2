import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  classifySealedSubcategory,
  isSealedTcgCsvProduct,
  resolveTcgCsvSealedCaps,
  TCGCSV_CATEGORY_BY_GAME,
  TcgCsvSealedProvider,
} from "../TcgCsvSealedProvider.js";
import { inferSourceType } from "../../../application/SourceTrust.js";

describe("TcgCsvSealedProvider helpers", () => {
  beforeEach(() => {
    delete process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS;
    delete process.env.TCGCSV_SEALED_MAX_GROUPS;
  });

  afterEach(() => {
    delete process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS;
    delete process.env.TCGCSV_SEALED_MAX_GROUPS;
  });

  it("maps validated games and excludes ADR-016 denylist", () => {
    expect(TCGCSV_CATEGORY_BY_GAME.LORCANA).toBe(71);
    expect(TCGCSV_CATEGORY_BY_GAME.POKEMON).toBe(3);
    expect(TCGCSV_CATEGORY_BY_GAME.GUNDAM).toBe(86);
    expect(TCGCSV_CATEGORY_BY_GAME.RIFTBOUND).toBe(89);
    expect(TCGCSV_CATEGORY_BY_GAME.SWU).toBeUndefined();
  });

  it("resolves per-game caps with full defaults", () => {
    const caps = resolveTcgCsvSealedCaps("full");
    expect(caps.maxGroupsPerGame).toBe(80);
    expect(caps.maxProductsPerGame).toBe(500);
    expect(caps.maxProductsGlobal).toBe(6000);
  });

  it("classifies sealed product names", () => {
    expect(classifySealedSubcategory("elite trainer box scarlet")).toBe("ELITE_TRAINER_BOX");
    expect(classifySealedSubcategory("booster pack")).toBe("BOOSTER_PACK");
    expect(classifySealedSubcategory("booster box display")).toBe("BOOSTER_BOX");
    expect(classifySealedSubcategory("starter deck 31")).toBe("STARTER_DECK");
  });

  it("filters singles out of sealed keyword check", () => {
    expect(isSealedTcgCsvProduct("Charizard ex #223")).toBe(false);
    expect(isSealedTcgCsvProduct("Booster Box — Scarlet")).toBe(true);
  });

  it("assigns distributor_feed trust to tcgcsv-sealed", () => {
    expect(inferSourceType("tcgcsv-sealed")).toBe("distributor_feed");
    expect(inferSourceType("lorcana-json-sealed")).toBe("publisher_api");
  });
});

describe("TcgCsvSealedProvider per-game budget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS;
  });

  it("allocates sealed items to a non-MTG game under a tight global budget", async () => {
    process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME = "1";
    process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME = "2";
    process.env.TCGCSV_SEALED_MAX_PRODUCTS = "4";

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/groups")) {
        const categoryId = Number(url.split("/").at(-2));
        return new Response(
          JSON.stringify({
            results: [{ groupId: categoryId * 1000, name: `Set ${categoryId}`, publishedOn: "2026-07-01" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.endsWith("/products")) {
        const categoryId = Number(url.split("/").at(-3));
        return new Response(
          JSON.stringify({
            results: [
              {
                productId: categoryId * 10 + 1,
                name: "Booster Box Alpha",
                imageUrl: "https://example.com/a.jpg",
              },
              {
                productId: categoryId * 10 + 2,
                name: "Booster Pack Beta",
                imageUrl: "https://example.com/b.jpg",
              },
              {
                productId: categoryId * 10 + 3,
                name: "Booster Box Gamma",
                imageUrl: "https://example.com/c.jpg",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new TcgCsvSealedProvider();
    const result = await provider.syncProducts({
      mode: "full",
      requestId: "test",
      since: null,
    });

    expect(result.ok).toBe(true);
    expect(result.count).toBe(4);
    const games = new Set(result.items.map((i) => i.game));
    expect(games.has("MTG")).toBe(true);
    expect(games.size).toBeGreaterThanOrEqual(2);
    expect([...games].some((g) => g !== "MTG")).toBe(true);
  });
});
