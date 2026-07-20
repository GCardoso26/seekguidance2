import { describe, expect, it } from "vitest";
import { createCatalogProvider, listCatalogProviderKeys } from "../../factory.js";
import { getGameConfig } from "../../gameConfigRegistry.js";
import { clearPokemonDatasetCache, getCardById } from "../DatasetLoader.js";
import { PokemonProvider } from "../PokemonProvider.js";

describe("PokemonProvider", () => {
  it("está registrado na factory", () => {
    expect(listCatalogProviderKeys()).toContain("POKEMON:pokemon-dataset");
    const p = createCatalogProvider("POKEMON", "pokemon-dataset");
    expect(p).toBeInstanceOf(PokemonProvider);
    expect(p.capabilities.prices).toBe(false);
  });

  it("syncSets / syncCards do dataset shadow", async () => {
    clearPokemonDatasetCache();
    const p = new PokemonProvider();
    const sets = await p.syncSets({ requestId: "t1", mode: "SHADOW" });
    expect(sets.ok).toBe(true);
    expect(sets.count).toBeGreaterThanOrEqual(1);

    const cards = await p.syncCards({ requestId: "t2", mode: "SHADOW" }, "SV3");
    expect(cards.ok).toBe(true);
    expect(cards.items?.some((c) => c.name === "Charizard ex")).toBe(true);
  });

  it("syncVariants reverse_holo", async () => {
    const p = new PokemonProvider();
    const res = await p.syncVariants({ requestId: "t3", mode: "LIVE" }, "pkm_pikachu_sv3");
    expect(res.ok).toBe(true);
    expect(res.count).toBeGreaterThanOrEqual(1);
  });

  it("mode OFF no-op", async () => {
    const p = new PokemonProvider();
    const sets = await p.syncSets({ requestId: "off", mode: "OFF" });
    expect(sets.count).toBe(0);
  });

  it("watchlist cards no dataset", () => {
    expect(getCardById("pkm_professors_research")?.name).toBe("Professor's Research");
  });

  it("GameConfig Pokémon", () => {
    const cfg = getGameConfig("POKEMON");
    expect(cfg?.rarities.some((r) => r.value === "Illustration Rare")).toBe(true);
    expect(cfg?.searchSynonyms.pika).toContain("pikachu");
  });
});
