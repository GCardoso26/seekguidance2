import type { ScryfallCard } from "./types.js";

/** Resolve URL de arte Scryfall (normal preferido). */
export function resolveScryfallImageUrl(card: ScryfallCard): string | null {
  return (
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    card.image_uris?.large ??
    null
  );
}
