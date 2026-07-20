import { ScryfallProvider } from "./magic/ScryfallProvider.js";
import { LorcanaProvider } from "./lorcana/LorcanaProvider.js";
import { PokemonProvider } from "./pokemon/PokemonProvider.js";
import type { CatalogProvider } from "./interfaces/CatalogProvider.js";

const factories = new Map<string, () => CatalogProvider>([
  ["MTG:scryfall", () => new ScryfallProvider()],
  ["LORCANA:lorcana-dataset", () => new LorcanaProvider()],
  ["POKEMON:pokemon-dataset", () => new PokemonProvider()],
]);

export function createCatalogProvider(gameCode: string, providerId: string): CatalogProvider {
  const key = `${gameCode}:${providerId}`;
  const factory = factories.get(key);
  if (!factory) {
    throw new Error(`unknown_catalog_provider:${key}`);
  }
  return factory();
}

export function listCatalogProviderKeys(): string[] {
  return [...factories.keys()];
}
