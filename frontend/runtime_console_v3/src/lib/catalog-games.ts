import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";
import { IMPLEMENTATION_WAVE_GAME_IDS, isGameInImplementationWave } from "@/lib/game-rollout";
import type { CatalogHealthReport } from "@/types/card";

export interface GameInfo {
  id: string;
  name: string;
  logoUrl: string;
  cardCount: number;
  primaryColor: string;
  isAvailable: boolean;
}

/** Mock estático para bootstrap SSR/client (ISO fixo evita mismatch de hidratação). */
const MOCK_BY_GAME: CatalogHealthReport["by_game"] = {
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
};

const MOCK_TOTAL_CARDS = Object.values(MOCK_BY_GAME).reduce((sum, n) => sum + (n ?? 0), 0);

export const MOCK_CATALOG_HEALTH: CatalogHealthReport = {
  status: "ready_for_marketplace",
  total_cards: MOCK_TOTAL_CARDS,
  by_game: MOCK_BY_GAME,
  missing_images: [],
  missing_prices: [],
  last_sync: { MTG: "2024-01-01T00:00:00.000Z" },
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
      isAvailable: count > 0 && isGameInImplementationWave(id),
    };
  });
}

export function countAvailableGames(health?: CatalogHealthReport | null): number {
  return mapHealthToGames(health).filter((g) => g.isAvailable).length;
}

/** Jogos sempre visíveis no mega-menu do header (apenas wave de implementação). */
export const MEGA_MENU_GAME_IDS = IMPLEMENTATION_WAVE_GAME_IDS;

export function getMegaMenuGames(health?: CatalogHealthReport | null): GameInfo[] {
  const byHealth = new Map(mapHealthToGames(health).map((g) => [g.id, g]));
  return MEGA_MENU_GAME_IDS.filter((id) => isGameInImplementationWave(id)).map((id) => {
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
