import { describe, expect, it } from "vitest";
import { createPublisherSealedProvider } from "../createPublisherSealedProvider.js";

describe("createPublisherSealedProvider", () => {
  it("emits BOOSTER_BOX and BOOSTER_PACK per set without inventing pack images", async () => {
    const Provider = createPublisherSealedProvider({
      providerId: "test-sealed",
      game: "FAB",
      publisher: "Legend Story Studios",
      brand: "Flesh and Blood",
      fetchSets: async () => [{ code: "SUP", name: "Super Slam" }],
      packshotUrlForSku: (sku) =>
        sku === "FAB-BOX-SUP" ? "https://cdn.example.com/box.png" : undefined,
    });
    const provider = new Provider();
    const result = await provider.syncProducts({} as never);
    expect(result.ok).toBe(true);
    expect(result.items?.map((i) => i.sku)).toEqual(["FAB-BOX-SUP", "FAB-PACK-SUP"]);
    expect(result.items?.[0]?.subcategory).toBe("BOOSTER_BOX");
    expect(result.items?.[1]?.subcategory).toBe("BOOSTER_PACK");
    expect(result.items?.[0]?.variants?.[0]?.images).toHaveLength(1);
    expect(result.items?.[1]?.variants?.[0]?.images).toEqual([]);
  });

  it("attaches packshot only when PACK SKU is curated", async () => {
    const Provider = createPublisherSealedProvider({
      providerId: "test-sealed",
      game: "GUNDAM",
      publisher: "Bandai",
      brand: "Gundam Card Game",
      fetchSets: async () => [{ code: "GD01", name: "Newtype Rising" }],
      packshotUrlForSku: (sku) =>
        sku === "GUNDAM-PACK-GD01" ? "https://cdn.example.com/pack.webp" : undefined,
    });
    const result = await new Provider().syncProducts({} as never);
    const pack = result.items?.find((i) => i.sku === "GUNDAM-PACK-GD01");
    expect(pack?.variants?.[0]?.images?.[0]?.sourceUrl).toBe("https://cdn.example.com/pack.webp");
  });
});
