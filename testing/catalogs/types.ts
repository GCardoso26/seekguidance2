import type { GameSlug, InventoryLine } from "../personas/core/types.ts";

/**
 * Dataset de cartas por jogo — separado do comportamento (archetype).
 * Trocar `dataset = pokemon` não altera a suíte; só o pack.
 */
export type GameCatalog = {
  game: GameSlug;
  /** false = scaffold (ex.: Naruto) — E2E não deve depender deste pack */
  datasetReady: boolean;
  displayName: string;
  /** Pool de singles para inventário / listings */
  staples: InventoryLine[];
  /** Cartas alvo de wishlist competitiva */
  competitiveTargets: string[];
  /** Favoritos / wishlist de collector */
  collectorTargets: {
    favorites: string[];
    wishlist: string[];
  };
  /** Cartas extras (promo, enchanted, etc.) */
  premium?: InventoryLine[];
};

export type CatalogOverrides = {
  /** IDs estáveis legados (não regenerar e quebrar aliases) */
  personaIds?: Partial<
    Record<"seller-large" | "seller-small" | "competitive" | "collector" | "casual" | "buyer", string>
  >;
  shopSlugs?: Partial<Record<"seller-large" | "seller-small", string>>;
};
