/**
 * Catálogo de categorias de produtos selados/acessórios por TCG.
 * Estrutura inspirada no CardTrader (HTML de referência na raiz do monorepo).
 */
import type { GameId } from "@/types/card";
import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";

export type ProductCategoryId =
  | "single"
  | "oversized"
  | "token"
  | "booster"
  | "booster_box"
  | "starter_deck"
  | "preconstructed_deck"
  | "bundle"
  | "box_set_display"
  | "tin"
  | "complete_set"
  | "sleeve"
  | "album"
  | "deck_box"
  | "playmat"
  | "dice"
  | "accessory"
  | "empty_storage"
  | "blisters"
  | "prerelease_pack"
  | "memorabilia"
  | "don_card"
  | "memory_gauge"
  | "art_card_token";

export type ProductCategoryMeta = {
  id: ProductCategoryId;
  label: string;
  /** Caminho estático no banco de imagens local */
  imageUrl: string;
};

/** Metadados globais — imagens em /public/images/product-types/ */
export const PRODUCT_CATEGORY_META: Record<ProductCategoryId, ProductCategoryMeta> = {
  single: { id: "single", label: "Singles", imageUrl: "/images/product-types/single.svg" },
  oversized: { id: "oversized", label: "Oversized", imageUrl: "/images/product-types/oversized.svg" },
  token: { id: "token", label: "Tokens / Emblemas", imageUrl: "/images/product-types/token.svg" },
  booster: { id: "booster", label: "Boosters", imageUrl: "/images/product-types/booster.svg" },
  booster_box: { id: "booster_box", label: "Booster Boxes", imageUrl: "/images/product-types/booster_box.svg" },
  starter_deck: { id: "starter_deck", label: "Starter Decks", imageUrl: "/images/product-types/starter_deck.svg" },
  preconstructed_deck: {
    id: "preconstructed_deck",
    label: "Decks Pré-construídos",
    imageUrl: "/images/product-types/preconstructed_deck.svg",
  },
  bundle: { id: "bundle", label: "Bundles", imageUrl: "/images/product-types/bundle.svg" },
  box_set_display: {
    id: "box_set_display",
    label: "Box Sets & Displays",
    imageUrl: "/images/product-types/box_set_display.svg",
  },
  tin: { id: "tin", label: "Latas / Tins", imageUrl: "/images/product-types/tin.svg" },
  complete_set: { id: "complete_set", label: "Complete Sets", imageUrl: "/images/product-types/complete_set.svg" },
  sleeve: { id: "sleeve", label: "Sleeves", imageUrl: "/images/product-types/sleeve.svg" },
  album: { id: "album", label: "Pastas / Albums", imageUrl: "/images/product-types/album.svg" },
  deck_box: { id: "deck_box", label: "Deck Boxes", imageUrl: "/images/product-types/deck_box.svg" },
  playmat: { id: "playmat", label: "Playmats", imageUrl: "/images/product-types/playmat.svg" },
  dice: { id: "dice", label: "Dados", imageUrl: "/images/product-types/dice.svg" },
  accessory: { id: "accessory", label: "Acessórios", imageUrl: "/images/product-types/accessory.svg" },
  empty_storage: {
    id: "empty_storage",
    label: "Caixas Vazias & Storage",
    imageUrl: "/images/product-types/empty_storage.svg",
  },
  blisters: { id: "blisters", label: "Blisters", imageUrl: "/images/product-types/blisters.svg" },
  prerelease_pack: {
    id: "prerelease_pack",
    label: "Prerelease Packs",
    imageUrl: "/images/product-types/prerelease_pack.svg",
  },
  memorabilia: { id: "memorabilia", label: "Memorabilia", imageUrl: "/images/product-types/memorabilia.svg" },
  don_card: { id: "don_card", label: "Cartas DON!!", imageUrl: "/images/product-types/don_card.svg" },
  memory_gauge: {
    id: "memory_gauge",
    label: "Memory Gauge / Tokens",
    imageUrl: "/images/product-types/memory_gauge.svg",
  },
  art_card_token: {
    id: "art_card_token",
    label: "Art Card / Token",
    imageUrl: "/images/product-types/art_card_token.svg",
  },
};

/** Categorias por jogo (extraídas dos HTML CardTrader Lorcana + Sorcery + mega-menu). */
export const GAME_PRODUCT_CATEGORIES: Record<GameId, ProductCategoryId[]> = {
  MTG: [
    "single",
    "token",
    "oversized",
    "booster_box",
    "booster",
    "bundle",
    "prerelease_pack",
    "tin",
    "complete_set",
    "preconstructed_deck",
    "sleeve",
    "playmat",
    "deck_box",
    "album",
  ],
  POKEMON: [
    "single",
    "oversized",
    "booster_box",
    "booster",
    "bundle",
    "blisters",
    "complete_set",
    "preconstructed_deck",
    "box_set_display",
    "tin",
    "sleeve",
    "album",
  ],
  YGO: [
    "single",
    "oversized",
    "booster_box",
    "booster",
    "bundle",
    "preconstructed_deck",
    "starter_deck",
    "tin",
    "accessory",
    "dice",
    "sleeve",
  ],
  LORCANA: [
    "single",
    "oversized",
    "empty_storage",
    "booster_box",
    "booster",
    "starter_deck",
    "bundle",
    "box_set_display",
    "album",
    "complete_set",
    "sleeve",
    "playmat",
  ],
  ONEPIECE: [
    "single",
    "don_card",
    "booster_box",
    "booster",
    "playmat",
    "bundle",
    "tin",
    "starter_deck",
    "memorabilia",
    "album",
    "sleeve",
  ],
  FAB: [
    "single",
    "booster_box",
    "booster",
    "preconstructed_deck",
    "art_card_token",
    "complete_set",
    "box_set_display",
    "dice",
    "playmat",
    "sleeve",
  ],
  DIGIMON: [
    "single",
    "memory_gauge",
    "booster_box",
    "booster",
    "bundle",
    "starter_deck",
    "playmat",
    "album",
    "sleeve",
    "deck_box",
  ],
  SWU: [
    "single",
    "booster_box",
    "booster",
    "bundle",
    "starter_deck",
    "playmat",
    "sleeve",
    "album",
  ],
  RIFTBOUND: ["single", "booster_box", "booster", "starter_deck", "sleeve", "playmat"],
  SORCERY: [
    "single",
    "booster_box",
    "token",
    "booster",
    "preconstructed_deck",
    "box_set_display",
    "sleeve",
    "playmat",
    "deck_box",
    "album",
  ],
  UARENA: ["single", "booster_box", "booster", "starter_deck", "sleeve", "playmat", "album"],
  DBFW: ["single", "booster", "sleeve", "album", "booster_box", "starter_deck", "playmat"],
  VANGUARD: ["single", "sleeve", "booster", "starter_deck", "booster_box", "playmat"],
};

/** Destaque por jogo — imagem padrão da categoria principal selada */
export const GAME_FEATURED_CATEGORY: Partial<Record<GameId, ProductCategoryId>> = {
  LORCANA: "booster_box",
  SORCERY: "booster_box",
  MTG: "booster_box",
  POKEMON: "booster_box",
  YGO: "booster_box",
  FAB: "booster_box",
  DIGIMON: "booster_box",
  ONEPIECE: "booster_box",
  SWU: "booster_box",
  RIFTBOUND: "booster_box",
  UARENA: "booster_box",
  DBFW: "booster_box",
  VANGUARD: "booster_box",
};

export const ALL_PRODUCT_CATEGORY_IDS = Object.keys(PRODUCT_CATEGORY_META) as ProductCategoryId[];

/** IDs aceitos pela API (inclui legado). */
export const API_PRODUCT_CATEGORIES = ALL_PRODUCT_CATEGORY_IDS;

export function getCategoriesForGame(gameId: GameId): ProductCategoryMeta[] {
  const ids = GAME_PRODUCT_CATEGORIES[gameId] ?? ["single", "booster", "booster_box", "accessory"];
  return ids.map((id) => PRODUCT_CATEGORY_META[id]);
}

export function getCategoryMeta(id: string): ProductCategoryMeta | undefined {
  return PRODUCT_CATEGORY_META[id as ProductCategoryId];
}

export function categoryLabel(id: string): string {
  return getCategoryMeta(id)?.label ?? id.replace(/_/g, " ");
}

export function categoryImageUrl(id: string): string {
  return getCategoryMeta(id)?.imageUrl ?? "/images/product-types/accessory.svg";
}

/** URL de listagem marketplace com jogo + categoria.
 * Must use /marketplace/produtos — bare /marketplace redirects to /loja and drops filters (BUG-V5-005 / V6.4-004).
 */
export function marketplaceCategoryHref(gameSlug: string, categoryId: ProductCategoryId): string {
  const gameId = Object.entries(GAME_TOKENS).find(([, t]) => t.slug === gameSlug)?.[0];
  const params = new URLSearchParams();
  if (gameId) params.set("game_id", gameId);
  params.set("category", categoryId);
  return `/marketplace/produtos?${params.toString()}`;
}

/** Singles → busca de cartas no catálogo (namespace CardTrader) */
export function singlesSearchHref(gameSlug: string): string {
  return `/${gameSlug}/cards`;
}

import { gameExpansionsPath } from "@/lib/game-routes";

export function expansionsHref(gameSlug: string): string {
  return gameExpansionsPath(gameSlug);
}

/** Lista de jogos para navegação (ordem marketplace). */
export const NAV_GAME_IDS: GameId[] = ALL_GAME_IDS.filter(
  (id) => (GAME_PRODUCT_CATEGORIES[id]?.length ?? 0) > 0,
);

/** Retrocompat: SHOP_CATEGORIES para forms legados */
export const SHOP_CATEGORIES_FLAT = ALL_PRODUCT_CATEGORY_IDS.map((id) => ({
  id,
  label: PRODUCT_CATEGORY_META[id].label,
}));
