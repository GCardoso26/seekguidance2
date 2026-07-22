/**
 * Rotas canônicas de navegação por TCG (namespace estilo CardTrader).
 * `/loja/*` permanece como alias legado via redirects no next.config.
 */
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

export const ALL_GAME_SLUGS = Object.values(GAME_TOKENS).map((t) => t.slug);

export function isKnownGameSlug(slug: string): boolean {
  return gameIdFromSlug(slug) !== null;
}

export function gameLandingPath(slug: string): string {
  return `/${slug}`;
}

export function gameCardsPath(slug: string): string {
  return `/${slug}/cards`;
}

export function gameCardDetailPath(slug: string, cardId: string): string {
  return `/${slug}/cards/${encodeURIComponent(cardId)}`;
}

export function gameExpansionsPath(slug: string): string {
  return `/${slug}/expansions`;
}

/** Canonical expansion landing — Epic 6 (`/{game}/sets/{setSlug}`). */
export function gameSetPath(slug: string, setSlug: string): string {
  return `/${slug}/sets/${encodeURIComponent(setSlug)}`;
}

/** Alias under /expansions/[setSlug] — same landing. */
export function gameExpansionDetailPath(slug: string, setSlug: string): string {
  return `/${slug}/expansions/${encodeURIComponent(setSlug)}`;
}

export function gameSellersPath(slug: string): string {
  return `/${slug}/sellers`;
}

export function gameMarketplacePath(slug: string, gameId: GameId): string {
  return `/loja/busca?game=${encodeURIComponent(gameId)}`;
}

export function gameCollectionPath(slug: string): string {
  return `/colecao?game=${encodeURIComponent(slug)}`;
}

export function gameWishlistPath(): string {
  return `/wishlist`;
}

/** Paths legados `/loja/*` — mantidos para compatibilidade. */
export function legacyGameLandingPath(slug: string): string {
  return `/loja/${slug}`;
}

export function legacyGameCardsPath(slug: string): string {
  return `/loja/${slug}/busca`;
}

export function legacyCardDetailPath(cardId: string): string {
  return `/loja/cartas/${encodeURIComponent(cardId)}`;
}

export function gameIdFromSlugOrThrow(slug: string): GameId {
  const id = gameIdFromSlug(slug);
  if (!id) throw new Error(`unknown_game_slug:${slug}`);
  return id;
}
