/**
 * Set logo assets under /public/logos/sets/{gameSlug}/.
 * Lorcana: lor1…lor13 (First Chapter → Attack of the Vine).
 * Other games: add folders when assets exist (same pattern).
 */
import type { GameId } from "@/types/card";

/** Catalog set code → logo file index (chapter number). */
export const LORCANA_SET_LOGO_INDEX: Record<string, number> = {
  TFC: 1,
  ROF: 2,
  INK: 3,
  URS: 4,
  SSK: 5,
  AZS: 6,
  ARI: 7,
  ROJ: 8,
  FAB: 9,
  WHI: 10,
  WIN: 11,
  WUN: 12,
  ATV: 13,
  AOV: 13,
};

/** Featured carousel — last 3 chapters (override when API order differs).
 * Prod uses AOV ("Attack of the Vines"); ATV is an alternate code kept in logo map.
 */
export const LORCANA_FEATURED_SET_CODES = ["WIN", "WUN", "AOV"] as const;

const GAME_SET_LOGO_INDEX: Partial<Record<GameId, Record<string, number>>> = {
  LORCANA: LORCANA_SET_LOGO_INDEX,
};

const GAME_SLUG_FOR_LOGOS: Partial<Record<GameId, string>> = {
  LORCANA: "lorcana",
};

export function setLogoPublicPath(gameId: GameId, setCode: string): string | null {
  const slug = GAME_SLUG_FOR_LOGOS[gameId];
  const indexMap = GAME_SET_LOGO_INDEX[gameId];
  if (!slug || !indexMap) return null;
  const idx = indexMap[setCode.trim().toUpperCase()];
  if (!idx) return null;
  return `/logos/sets/${slug}/lor${idx}.svg`;
}

export function gameHasSetLogos(gameId: GameId): boolean {
  return Boolean(GAME_SLUG_FOR_LOGOS[gameId] && GAME_SET_LOGO_INDEX[gameId]);
}

export function featuredSetCodesForGame(gameId: GameId): readonly string[] {
  if (gameId === "LORCANA") return LORCANA_FEATURED_SET_CODES;
  return [];
}
