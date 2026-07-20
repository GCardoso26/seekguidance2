import type { PokemonDatasetCard } from "./types.js";

export function resolvePokemonImageUrl(card: PokemonDatasetCard): string | null {
  return card.imageUrl ?? null;
}
