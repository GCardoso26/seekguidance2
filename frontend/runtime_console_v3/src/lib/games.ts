import type { GameId } from "@/types/card";
import { GAME_TOKENS, gameSlugFromId } from "@/lib/tcg-tokens";

export type GameFilterKey = "set" | "rarity" | "color" | "type" | "price" | "condition" | "foil";

export interface CatalogGameApi {
  id: string;
  game_code: string;
  slug: string;
  name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_active: boolean;
  api_source?: string;
  card_count: number;
  last_sync_at?: string | null;
  sort_order: number;
}

export interface GameConfig {
  code: GameId;
  slug: string;
  filters: GameFilterKey[];
  colorLabel?: string;
  typeLabel?: string;
}

const GAME_CONFIG: Partial<Record<GameId, GameConfig>> = {
  MTG: {
    code: "MTG",
    slug: "mtg",
    filters: ["set", "rarity", "color", "type", "price", "condition", "foil"],
    colorLabel: "Cores",
    typeLabel: "Tipo",
  },
  POKEMON: {
    code: "POKEMON",
    slug: "pokemon",
    filters: ["set", "rarity", "type", "price", "condition"],
    typeLabel: "Tipo",
  },
  YGO: {
    code: "YGO",
    slug: "yugioh",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo de carta",
  },
  LORCANA: {
    code: "LORCANA",
    slug: "lorcana",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo",
  },
  ONEPIECE: {
    code: "ONEPIECE",
    slug: "onepiece",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo",
  },
  FAB: {
    code: "FAB",
    slug: "fab",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Classe",
  },
  DIGIMON: {
    code: "DIGIMON",
    slug: "digimon",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo",
  },
  SWU: {
    code: "SWU",
    slug: "swu",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo",
  },
  RIFTBOUND: {
    code: "RIFTBOUND",
    slug: "riftbound",
    filters: ["set", "rarity", "type", "price"],
    colorLabel: "Domínios",
    typeLabel: "Tipo",
  },
  SORCERY: {
    code: "SORCERY",
    slug: "sorcery",
    filters: ["set", "rarity", "type", "price"],
    colorLabel: "Elemento",
    typeLabel: "Tipo",
  },
  UARENA: {
    code: "UARENA",
    slug: "union-arena",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Tipo",
  },
  DBFW: {
    code: "DBFW",
    slug: "dbfw",
    filters: ["set", "rarity", "type", "price"],
    colorLabel: "Cor",
    typeLabel: "Tipo",
  },
  VANGUARD: {
    code: "VANGUARD",
    slug: "vanguard",
    filters: ["set", "rarity", "type", "price"],
    typeLabel: "Clã",
  },
};

export function getGameConfig(gameId: GameId): GameConfig {
  return (
    GAME_CONFIG[gameId] ?? {
      code: gameId,
      slug: gameSlugFromId(gameId),
      filters: ["set", "rarity", "price"],
    }
  );
}

export function catalogGameToDisplay(game: CatalogGameApi) {
  const code = game.game_code as GameId;
  const token = GAME_TOKENS[code];
  return {
    id: game.id,
    code,
    slug: game.slug,
    name: game.display_name || token?.name || game.name,
    description: game.description,
    logoUrl: game.logo_url || token?.logo || "/logos/mtg.svg",
    bannerUrl: game.banner_url,
    cardCount: game.card_count,
    lastSyncAt: game.last_sync_at,
    isAvailable: game.card_count > 0,
    primaryColor: token?.primary ?? "#6366f1",
    apiSource: game.api_source,
  };
}

export const DEFAULT_GAME_ORDER = [
  "mtg",
  "pokemon",
  "yugioh",
  "lorcana",
  "onepiece",
  "fab",
  "digimon",
  "swu",
  "riftbound",
  "sorcery",
  "union-arena",
  "dbfw",
  "vanguard",
] as const;
