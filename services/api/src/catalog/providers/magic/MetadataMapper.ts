import type { CardDTO, SetDTO, VariantDTO } from "../interfaces/CatalogProvider.js";
import { resolveScryfallImageUrl } from "./ImageResolver.js";
import type { ScryfallCard, ScryfallSet } from "./types.js";

export function mapSet(set: ScryfallSet): SetDTO {
  return {
    providerSetId: set.id,
    code: set.code.toUpperCase(),
    name: set.name,
    releaseDate: set.released_at,
  };
}

export function mapCard(c: ScryfallCard): CardDTO {
  return {
    providerCardId: c.id,
    providerSetId: c.set,
    name: c.name,
    normalizedName: c.name.trim().toLowerCase().replace(/\s+/g, " "),
    cardNumber: c.collector_number,
    rarity: c.rarity,
    language: c.lang,
    oracleText: c.oracle_text ?? c.card_faces?.[0]?.oracle_text,
    typeLine: c.type_line ?? c.card_faces?.[0]?.type_line,
    artist: c.artist,
    imageUrl: resolveScryfallImageUrl(c) ?? undefined,
    legalities: c.legalities,
    gameData: {
      finishes: c.finishes,
      foil: c.foil,
      nonfoil: c.nonfoil,
      scryfall_id: c.id,
    },
  };
}

/**
 * Variants a partir de finishes Scryfall.
 * Fallback: nonfoil/foil flags quando finishes ausente.
 */
export function mapVariants(card: ScryfallCard): VariantDTO[] {
  let finishes = card.finishes?.filter(Boolean) ?? [];
  if (finishes.length === 0) {
    if (card.nonfoil !== false) finishes.push("nonfoil");
    if (card.foil) finishes.push("foil");
  }
  if (finishes.length === 0) finishes = ["nonfoil"];

  return finishes.map((finish) => {
    const lower = finish.toLowerCase();
    const isFoil = lower.includes("foil") || lower === "etched" || lower === "serialized";
    return {
      providerVariantId: `${card.id}:${finish}`,
      finish,
      language: card.lang ?? "en",
      isFoil,
      label: finish.charAt(0).toUpperCase() + finish.slice(1),
    };
  });
}
