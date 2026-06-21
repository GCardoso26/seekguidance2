import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CatalogHealthReport } from "@/types/card";

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
    POKEMON: 0,
    YGO: 0,
    LORCANA: 0,
    ONEPIECE: 0,
    FAB: 0,
    DIGIMON: 0,
    SWU: 0,
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
