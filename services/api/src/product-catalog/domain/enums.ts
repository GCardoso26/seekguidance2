/** Categorias oficiais do Catálogo Mestre (acessórios + selados). */
export const ProductCategory = {
  SEALED_PRODUCT: "SEALED_PRODUCT",
  SLEEVES: "SLEEVES",
  DECK_BOX: "DECK_BOX",
  BINDER: "BINDER",
  BINDER_PAGE: "BINDER_PAGE",
  DICE: "DICE",
  COUNTERS: "COUNTERS",
  PLAYMAT: "PLAYMAT",
} as const;

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const ProductCondition = {
  NEW: "NEW",
  LIKE_NEW: "LIKE_NEW",
  GOOD: "GOOD",
  PLAYED: "PLAYED",
  HEAVILY_PLAYED: "HEAVILY_PLAYED",
  DAMAGED: "DAMAGED",
} as const;

export type ProductCondition = (typeof ProductCondition)[keyof typeof ProductCondition];

/** Tipo de produto (filtros marketplace / API pública). */
export const ProductType = {
  Accessory: "Accessory",
  Sealed: "Sealed",
  Single: "Single",
  Merchandise: "Merchandise",
  Apparel: "Apparel",
  Dice: "Dice",
  Token: "Token",
  Storage: "Storage",
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const CATEGORY_TO_PRODUCT_TYPE: Record<ProductCategory, ProductType> = {
  SEALED_PRODUCT: ProductType.Sealed,
  SLEEVES: ProductType.Accessory,
  DECK_BOX: ProductType.Storage,
  BINDER: ProductType.Storage,
  BINDER_PAGE: ProductType.Storage,
  DICE: ProductType.Dice,
  COUNTERS: ProductType.Accessory,
  PLAYMAT: ProductType.Accessory,
};

/** TCGs suportados no catálogo mestre (código estável). */
export const MASTER_CATALOG_GAMES = [
  "MTG",
  "POKEMON",
  "YUGIOH",
  "LORCANA",
  "ONE_PIECE",
  "DIGIMON",
  "DBFW",
  "SWU",
  "GUNDAM",
  "SORCERY",
  "FAB",
  "RIFTBOUND",
] as const;

export type MasterCatalogGame = (typeof MASTER_CATALOG_GAMES)[number];
