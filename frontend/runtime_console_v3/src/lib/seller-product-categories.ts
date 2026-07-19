/** Categorias de produtos não-card (mapeadas para store_products.category). */

import { isGameInImplementationWave } from "@/lib/game-rollout";

export type ProductCategoryId =
  | "sleeve"
  | "deck_box"
  | "album"
  | "playmat"
  | "booster"
  | "booster_box"
  | "accessory";

export const SELLER_PRODUCT_CATEGORIES: { id: ProductCategoryId; label: string }[] = [
  { id: "sleeve", label: "Sleeves" },
  { id: "deck_box", label: "Deck Box" },
  { id: "album", label: "Binder" },
  { id: "playmat", label: "Playmat" },
  { id: "booster", label: "Boosters" },
  { id: "booster_box", label: "Caixas" },
  { id: "accessory", label: "Acessórios" },
];

export const CATALOG_GAME_SLUGS = [
  { slug: "lorcana", label: "Lorcana" },
  { slug: "mtg", label: "Magic" },
  { slug: "pokemon", label: "Pokemon" },
  { slug: "yugioh", label: "Yu-Gi-Oh" },
  { slug: "onepiece", label: "One Piece" },
  { slug: "digimon", label: "Digimon" },
  { slug: "dbfw", label: "Dragon Ball" },
  { slug: "riftbound", label: "Riftbound" },
  { slug: "fab", label: "Flesh and Blood" },
  { slug: "vanguard", label: "Vanguard" },
  { slug: "union-arena", label: "Union Arena" },
  { slug: "swu", label: "Star Wars: Unlimited" },
  { slug: "sorcery", label: "Sorcery" },
] as const;

export type CatalogGameSlug = (typeof CATALOG_GAME_SLUGS)[number]["slug"];

export function isCatalogGameEnabled(slug: string): boolean {
  return isGameInImplementationWave(slug);
}

/** Primeiro jogo da wave (default da UI seller). */
export const DEFAULT_CATALOG_GAME_SLUG: CatalogGameSlug = "lorcana";
