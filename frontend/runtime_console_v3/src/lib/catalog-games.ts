import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CatalogHealthReport, GameId } from "@/types/card";

export interface GameInfo {
  id: string;
  name: string;
  logoUrl: string;
  cardCount: number;
  primaryColor: string;
  isAvailable: boolean;
}

/** Mock para dev quando /api/catalog/health indisponível */
export const MOCK_CATALOG_HEALTH: CatalogHealthReport = {
  status: "ready_for_marketplace",
  total_cards: 34717,
  by_game: {
    MTG: 34717,
    POKEMON: 23315,
    YGO: 14422,
    LORCANA: 2283,
    ONEPIECE: 3485,
    FAB: 13988,
    DIGIMON: 4297,
    SWU: 7729,
    RIFTBOUND: 0,
    SORCERY: 0,
    UARENA: 0,
    DBFW: 0,
    VANGUARD: 0,
  },
  missing_images: [],
  missing_prices: [],
  last_sync: { MTG: new Date().toISOString() },
  ready_for_marketplace: true,
  meilisearch: "disabled",
};

export function mapHealthToGames(health?: CatalogHealthReport | null): GameInfo[] {
  const byGame = health?.by_game ?? {};
  return ALL_GAME_IDS.map((id) => {
    const token = GAME_TOKENS[id];
    const count = byGame[id] ?? 0;
    return {
      id,
      name: token.name,
      logoUrl: token.logo,
      cardCount: count,
      primaryColor: token.primary,
      isAvailable: count > 0,
    };
  });
}

export function countAvailableGames(health?: CatalogHealthReport | null): number {
  return mapHealthToGames(health).filter((g) => g.isAvailable).length;
}

/** Jogos sempre visíveis no mega-menu do header (independente do health da API). */
export const MEGA_MENU_GAME_IDS = [
  "LORCANA",
  "MTG",
  "POKEMON",
  "YGO",
  "FAB",
  "DIGIMON",
  "ONEPIECE",
  "SWU",
] as const satisfies readonly GameId[];

export function getMegaMenuGames(health?: CatalogHealthReport | null): GameInfo[] {
  const byHealth = new Map(mapHealthToGames(health).map((g) => [g.id, g]));
  return MEGA_MENU_GAME_IDS.map((id) => {
    const fromApi = byHealth.get(id);
    const token = GAME_TOKENS[id];
    return {
      id,
      name: token.name,
      logoUrl: token.logo,
      cardCount: fromApi?.cardCount ?? 0,
      primaryColor: token.primary,
      isAvailable: true,
    };
  });
}
