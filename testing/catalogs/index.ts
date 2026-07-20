import type { GameSlug } from "../personas/core/types.ts";
import { digimonCatalog } from "./digimon.ts";
import { dragonballCatalog } from "./dragonball.ts";
import { lorcanaCatalog } from "./lorcana.ts";
import { mtgCatalog } from "./mtg.ts";
import { narutoCatalog } from "./naruto.ts";
import { onepieceCatalog } from "./onepiece.ts";
import { pokemonCatalog } from "./pokemon.ts";
import { riftboundCatalog } from "./riftbound.ts";
import type { CatalogOverrides, GameCatalog } from "./types.ts";

export type { CatalogOverrides, GameCatalog } from "./types.ts";
export {
  digimonCatalog,
  dragonballCatalog,
  lorcanaCatalog,
  mtgCatalog,
  narutoCatalog,
  onepieceCatalog,
  pokemonCatalog,
  riftboundCatalog,
};

export const GAME_CATALOGS: Record<GameSlug, GameCatalog> = {
  lorcana: lorcanaCatalog,
  mtg: mtgCatalog,
  pokemon: pokemonCatalog,
  onepiece: onepieceCatalog,
  digimon: digimonCatalog,
  dragonball: dragonballCatalog,
  riftbound: riftboundCatalog,
  naruto: narutoCatalog,
};

/** IDs estáveis para não quebrar aliases Playwright / credentials. */
export const LEGACY_ID_OVERRIDES: Partial<Record<GameSlug, CatalogOverrides>> = {
  lorcana: {
    personaIds: {
      "seller-large": "lorcana-store-alpha",
      competitive: "lorcana-competitive-buyer",
      collector: "lorcana-collector",
    },
    shopSlugs: { "seller-large": "lorcana-store-alpha" },
  },
  mtg: {
    personaIds: {
      "seller-large": "mtg-commander-store",
      "seller-small": "mtg-staples-seller",
      competitive: "mtg-competitive-buyer",
    },
    shopSlugs: {
      "seller-large": "commander-store",
      "seller-small": "staples-vendor",
    },
  },
  pokemon: {
    personaIds: {
      "seller-large": "pokemon-store-alpha",
      competitive: "pokemon-competitive",
      collector: "pokemon-collector",
    },
    shopSlugs: { "seller-large": "pokemon-store-alpha" },
  },
  onepiece: {
    personaIds: {
      "seller-large": "onepiece-store-alpha",
      competitive: "onepiece-competitive",
      collector: "onepiece-collector",
    },
    shopSlugs: { "seller-large": "onepiece-store-alpha" },
  },
  digimon: {
    personaIds: {
      "seller-large": "digimon-store-alpha",
      competitive: "digimon-competitive",
      collector: "digimon-collector",
    },
    shopSlugs: { "seller-large": "digimon-store-alpha" },
  },
  dragonball: {
    personaIds: {
      "seller-large": "dragonball-store-alpha",
      competitive: "dragonball-competitive",
      collector: "dragonball-collector",
    },
    shopSlugs: { "seller-large": "dragonball-store-alpha" },
  },
  riftbound: {
    personaIds: {
      "seller-small": "riftbound-store-alpha",
      buyer: "riftbound-buyer",
      collector: "riftbound-collector",
    },
    shopSlugs: { "seller-small": "riftbound-store-alpha" },
  },
  naruto: {
    personaIds: {
      "seller-small": "naruto-store-scaffold",
      buyer: "naruto-buyer-scaffold",
      collector: "naruto-collector-scaffold",
    },
    shopSlugs: { "seller-small": "naruto-store-scaffold" },
  },
};

export function getCatalog(game: GameSlug): GameCatalog {
  return GAME_CATALOGS[game];
}
