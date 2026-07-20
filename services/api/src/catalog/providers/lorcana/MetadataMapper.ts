import type { CardDTO, SetDTO, VariantDTO } from "../interfaces/CatalogProvider.js";
import { displayRarityFromConfig } from "../shared/rarityFromConfig.js";
import { lorcanaGameConfig } from "./GameConfig.js";
import { resolveLorcanaImageUrl } from "./ImageResolver.js";
import type { LorcanaDatasetCard, LorcanaDatasetSet } from "./types.js";

export function mapSet(set: LorcanaDatasetSet): SetDTO {
  return {
    providerSetId: set.id,
    code: set.code.toUpperCase(),
    name: set.name,
    releaseDate: set.releaseDate,
  };
}

export function displayName(card: LorcanaDatasetCard): string {
  if (card.version && card.version.trim().length > 0) {
    return `${card.name} – ${card.version}`;
  }
  return card.name;
}

export function mapCard(card: LorcanaDatasetCard): CardDTO {
  const name = displayName(card);
  const typeLine = [
    ...(card.type ?? []),
    ...(card.classifications?.length ? ["—", ...card.classifications] : []),
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    providerCardId: card.id,
    providerSetId: card.setCode.toUpperCase(),
    name,
    normalizedName: name.trim().toLowerCase().replace(/\s+/g, " "),
    cardNumber: card.collectorNumber,
    rarity: displayRarityFromConfig(lorcanaGameConfig.rarities, card.rarity),
    language: card.lang ?? "en",
    oracleText: card.text,
    typeLine: typeLine || undefined,
    artist: card.illustrators?.[0],
    imageUrl: resolveLorcanaImageUrl(card),
    legalities: card.legalities,
    gameData: {
      ink: card.ink,
      cost: card.cost,
      inkwell: card.inkwell,
      strength: card.strength,
      willpower: card.willpower,
      lore: card.lore,
      classifications: card.classifications,
      finishes: card.finishes,
      setCode: card.setCode,
      version: card.version,
      lorcana_id: card.id,
    },
  };
}

export function mapVariants(card: LorcanaDatasetCard): VariantDTO[] {
  const finishes = card.finishes?.length ? card.finishes : ["nonfoil"];
  return finishes.map((finish) => {
    const isFoil = finish.toLowerCase().includes("foil") && !finish.toLowerCase().includes("non");
    return {
      providerVariantId: `${card.id}:${finish}`,
      finish,
      language: card.lang ?? "en",
      isFoil,
      label: isFoil ? "Foil" : "Non-foil",
    };
  });
}
