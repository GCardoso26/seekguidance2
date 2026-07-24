import type { GameId } from "@/types/card";
import { isProductEcosystemDenied } from "@/lib/product-game-allowlist";

/**
 * Jogos na wave de implementação (navegáveis e configuráveis).
 * Demais TCGs ficam visualmente desabilitados / sem navegação.
 *
 * ADR-016: SWU, UARENA e VANGUARD têm hard-exit do ecossistema de produto e
 * NUNCA devem ser incluídos nesta wave.
 */
export const IMPLEMENTATION_WAVE_GAME_IDS = [
  "LORCANA",
  "MTG",
  "POKEMON",
  "YGO",
  "ONEPIECE",
  "DIGIMON",
  "DBFW",
  "RIFTBOUND",
  "FAB",
  "GUNDAM",
  "SORCERY",
] as const satisfies readonly GameId[];

export type ImplementationWaveGameId = (typeof IMPLEMENTATION_WAVE_GAME_IDS)[number];

const WAVE_SET = new Set<string>(IMPLEMENTATION_WAVE_GAME_IDS);

/** Slugs usados no painel seller / rotas públicas. */
export const IMPLEMENTATION_WAVE_SLUGS = [
  "lorcana",
  "mtg",
  "pokemon",
  "yugioh",
  "onepiece",
  "digimon",
  "dbfw",
  "dragon_ball",
  "riftbound",
  "fab",
  "gundam",
  "sorcery",
] as const;

const WAVE_SLUG_SET = new Set<string>(
  IMPLEMENTATION_WAVE_SLUGS.map((s) => s.replace(/-/g, "").toLowerCase()),
);

export function isGameInImplementationWave(gameIdOrSlug: string | null | undefined): boolean {
  if (!gameIdOrSlug) return false;
  const raw = gameIdOrSlug.trim();
  if (!raw) return false;
  // ADR-016 guard: hard-exited games must never be navigable, regardless of WAVE_SET contents.
  if (isProductEcosystemDenied(raw)) return false;
  const upper = raw.toUpperCase();
  if (WAVE_SET.has(upper)) return true;
  const slug = raw.toLowerCase().replace(/-/g, "");
  return WAVE_SLUG_SET.has(slug);
}
