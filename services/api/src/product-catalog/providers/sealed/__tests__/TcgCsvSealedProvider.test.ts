import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  classifySealedSubcategory,
  groupPassesMinYear,
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
    delete process.env.TCGCSV_SEALED_MIN_YEAR;
  });

  afterEach(() => {
    delete process.env.TCGCSV_SEALED_MAX_GROUPS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME;
    delete process.env.TCGCSV_SEALED_MAX_PRODUCTS;
    delete process.env.TCGCSV_SEALED_MAX_GROUPS;
    delete process.env.TCGCSV_SEALED_MIN_YEAR;
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
    expect(caps.minYear).toBe(0);
  });

  it("le TCGCSV_SEALED_MIN_YEAR e ignora valor invalido", () => {
    process.env.TCGCSV_SEALED_MIN_YEAR = "2024";
    expect(resolveTcgCsvSealedCaps("full").minYear).toBe(2024);
    process.env.TCGCSV_SEALED_MIN_YEAR = "nao-e-ano";
    expect(resolveTcgCsvSealedCaps("full").minYear).toBe(0);
  });

  it("corta grupos por ano e mantem grupo sem data", () => {
    expect(groupPassesMinYear("2023-11-03", 2024)).toBe(false);
    expect(groupPassesMinYear("2024-01-01", 2024)).toBe(true);
    expect(groupPassesMinYear("2026-05-10", 2024)).toBe(true);
    expect(groupPassesMinYear(undefined, 2024)).toBe(true);
    expect(groupPassesMinYear("2019-01-01", 0)).toBe(true);
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

  it.each([
    "Sting, Bilbo's Sword (Showcase)",
    "My Precious (Showcase)",
    "Tintagel",
    "Blue Destiny Unit-1 (EX)",
    "Blue Sentinel",
    "Gift of the Frog",
    "Destiny Draw",
    "Casey at the Bat",
    "Judy Hopps - On the Case",
    "Whispers in the Well Case File Cards (1 of 18)",
    "Fireball (Preconstructed Deck)",
    "Snorlax - 33/95 (Prerelease)",
    "Groudon ex - 038 (EX Collector's Tins)",
    "Squirtle - 33/214 (Premium Collection Promo)",
    "Display of Artistry (Blue)",
    "Deadly Display (Red)",
    "Treasure Trove",
    "Trove Golem",
    "Code Card - Starter Deck 10: Giblet (FS10)",
  ])("rejects single %s that leaked through substring matching", (name) => {
    expect(isSealedTcgCsvProduct(name)).toBe(false);
  });

  it.each([
    "30th Celebration Mini Tin [Espeon]",
    "Booster Box Case",
    "Elite Trainer Box - Surging Sparks",
    "Illumineer's Trove",
    "Premium Collection",
    "Prerelease Kit",
    "Build & Battle Stadium Display",
    "Disney Lorcana: Gateway Case",
    "Armory Deck: Malice Case",
    "30th Celebration ex Box Case",
    "Star Trek - Draft Night Case",
    "Disney Lorcana: Fabled Starter Deck (Emerald & Ruby)",
    "Origins - Champion Deck (Jinx) Display",
    "Starter Deck 07: Celestial Drive Display",
    "Magnificent Monsters Display",
    "The Four Elementals Preconstructed Deck: Air",
    "Disney Lorcana: Azurite Sea Illumineer's Trove",
  ])("accepts sealed %s", (name) => {
    expect(isSealedTcgCsvProduct(name)).toBe(true);
  });

  it("rejects rows carrying per-card extendedData even when the name looks sealed", () => {
    const cardFields = [
      { name: "Rarity", value: "Rare" },
      { name: "Number", value: "042" },
      { name: "Card Type", value: "Unit" },
    ];
    expect(isSealedTcgCsvProduct("Collection Box", cardFields)).toBe(false);
    expect(isSealedTcgCsvProduct("Collection Box", [{ name: "Description", value: "x" }])).toBe(
      true,
    );
  });

  it("no longer labels Showcase singles as COLLECTION_BOX", () => {
    expect(classifySealedSubcategory("30th celebration mini tin [espeon]")).toBe("COLLECTION_BOX");
    expect(classifySealedSubcategory("booster box case")).toBe("BOOSTER_BOX");
    expect(classifySealedSubcategory("illumineer's trove")).toBe("TROVE");
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
