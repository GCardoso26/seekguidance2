import type { CardDTO, SetDTO, VariantDTO } from "../interfaces/CatalogProvider.js";
import { resolvePokemonImageUrl } from "./ImageResolver.js";
import type { PokemonDatasetCard, PokemonDatasetSet } from "./types.js";

export function mapSet(set: PokemonDatasetSet): SetDTO {
  return {
    providerSetId: set.id,
    code: set.code.toUpperCase(),
    name: set.name,
    releaseDate: set.releaseDate,
  };
}

export function mapCard(card: PokemonDatasetCard): CardDTO {
  return {
    providerCardId: card.id,
    providerSetId: card.setCode.toUpperCase(),
    name: card.name,
    normalizedName: card.name.trim().toLowerCase().replace(/\s+/g, " "),
    cardNumber: card.collectorNumber,
    rarity: card.rarity,
    language: card.lang ?? "en",
    oracleText: card.text,
    typeLine: card.types?.join(" "),
    imageUrl: resolvePokemonImageUrl(card) ?? undefined,
    legalities: card.legalities,
    gameData: {
      types: card.types,
      hp: card.hp,
      stage: card.stage,
      finishes: card.finishes,
      setCode: card.setCode,
      pokemon_id: card.id,
    },
  };
}

export function mapVariants(card: PokemonDatasetCard): VariantDTO[] {
  const finishes = card.finishes?.length ? card.finishes : ["nonholo"];
  return finishes.map((finish) => {
    const lower = finish.toLowerCase();
    const isFoil = lower.includes("holo") && !lower.includes("non");
    return {
      providerVariantId: `${card.id}:${finish}`,
      finish,
      language: card.lang ?? "en",
      isFoil,
      label: finish.replace(/_/g, " "),
    };
  });
}
