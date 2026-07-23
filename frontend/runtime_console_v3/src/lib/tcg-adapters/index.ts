import { lorcanaAdapter } from "@/lib/tcg-adapters/lorcana";
import { mtgAdapter } from "@/lib/tcg-adapters/mtg";
import { pokemonAdapter } from "@/lib/tcg-adapters/pokemon";
import { swuAdapter } from "@/lib/tcg-adapters/swu";
import type { GameAdapter, GameCode } from "@/lib/tcg-adapters/types";

export * from "@/lib/tcg-adapters/types";
export * from "@/lib/tcg-adapters/parse-decklist";
export { TOURNAMENT_GAMES } from "@/lib/tcg-adapters/tournament-games";

const ADAPTERS: Record<GameCode, GameAdapter> = {
  POKEMON: pokemonAdapter,
  LORCANA: lorcanaAdapter,
  MTG: mtgAdapter,
  SWU: swuAdapter,
};

export function getGameAdapter(code: string): GameAdapter {
  const upper = code.toUpperCase() as GameCode;
  if (ADAPTERS[upper]) return ADAPTERS[upper];
  const bySlug = Object.values(ADAPTERS).find((a) => a.slug === code.toLowerCase());
  if (bySlug) return bySlug;
  throw new Error(`Jogo não suportado: ${code}`);
}

export function slugFromGameCode(code: GameCode): string {
  return ADAPTERS[code].slug;
}
