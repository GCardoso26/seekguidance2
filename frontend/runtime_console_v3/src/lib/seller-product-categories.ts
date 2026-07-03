/** Categorias de produtos não-card (mapeadas para store_products.category). */

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
  { slug: "mtg", label: "Magic" },
  { slug: "pokemon", label: "Pokemon" },
  { slug: "yugioh", label: "Yu-Gi-Oh" },
  { slug: "lorcana", label: "Lorcana" },
  { slug: "onepiece", label: "One Piece" },
  { slug: "digimon", label: "Digimon" },
  { slug: "dragon_ball", label: "Dragon Ball" },
  { slug: "vanguard", label: "Vanguard" },
  { slug: "union-arena", label: "Union Arena" },
  { slug: "riftbound", label: "Riftbound" },
] as const;
