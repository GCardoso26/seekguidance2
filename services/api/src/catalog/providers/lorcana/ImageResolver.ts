import type { LorcanaDatasetCard } from "./types.js";

/**
 * Resolve URL de imagem oficial/comunitária por ID.
 * Prefere imageUrl do dataset; fallback constrói path estável por id.
 */
export function resolveLorcanaImageUrl(card: LorcanaDatasetCard): string | undefined {
  if (card.imageUrl && card.imageUrl.length > 0) return card.imageUrl;
  return `https://cards.lorcast.io/card/digital/normal/${card.id}.webp`;
}
