/**
 * Rotas canônicas de navegação por TCG (namespace estilo CardTrader).
 * Landing: `/{slug}`; cards: `/{slug}/cards`. Alias `/loja/{slug}` fecha no layout.
 */
import { isProductEcosystemDenied } from "@/lib/product-game-allowlist";
import { gameIdFromSlug, GAME_TOKENS, PRODUCT_GAME_IDS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

/** Slugs navegáveis no ecossistema de produto (ADR-016: exclui hard-exit). */
export const ALL_GAME_SLUGS = PRODUCT_GAME_IDS.map((id) => GAME_TOKENS[id].slug);

export function isKnownGameSlug(slug: string): boolean {
  const id = gameIdFromSlug(slug);
  if (!id) return false;
  // ADR-016: hard-exit denylist — rotas /swu, /vanguard, /union-arena → 404.
  return !isProductEcosystemDenied(id);
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

/** Prefer gameSetPath; expansions/[set] 301 → sets/[set]. */
export function gameExpansionDetailPath(slug: string, setSlug: string): string {
  return gameSetPath(slug, setSlug);
}

export function gameSellersPath(slug: string): string {
  return `/${slug}/sellers`;
}

export function gameMarketplacePath(slug: string, gameId: GameId): string {
  return `/loja/busca?game=${encodeURIComponent(gameId)}`;
}

/** Marketplace busca com filtro de expansão/coleção já aplicado. */
export function gameMarketplaceSetPath(slug: string, gameId: GameId, setCode: string): string {
  const params = new URLSearchParams({
    game: gameId,
    set: setCode.trim(),
  });
  return `/loja/busca?${params.toString()}`;
}

export function gameCollectionPath(slug: string): string {
  return `/colecao?game=${encodeURIComponent(slug)}`;
}

export function gameWishlistPath(): string {
  return `/wishlist`;
}

export function gameIdFromSlugOrThrow(slug: string): GameId {
  const id = gameIdFromSlug(slug);
  if (!id) throw new Error(`unknown_game_slug:${slug}`);
  return id;
}
