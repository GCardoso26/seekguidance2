/** Official product lifecycle — publisher-sourced only. */
export const PRODUCT_LIFECYCLES = [
  "ANNOUNCED",
  "PREVIEW",
  "PREORDER",
  "AVAILABLE",
  "LOW_STOCK",
  "OUT_OF_PRINT",
  "DISCONTINUED",
  "HISTORICAL",
] as const;

export type ProductLifecycle = (typeof PRODUCT_LIFECYCLES)[number];

export const PRODUCT_CONTENT_TYPES = [
  "booster_pack",
  "card",
  "foil_card",
  "token",
  "sleeve",
  "dice",
  "divider",
  "guide",
  "life_wheel",
  "deck_box",
  "decklist",
  "pdf",
  "energy_pack",
  "marker",
  "storage_box",
  "promo",
  "other",
] as const;

export type ProductContentType = (typeof PRODUCT_CONTENT_TYPES)[number];

export const CONTENT_UNITS = ["pcs", "packs", "cards", "sheets", "set", "box"] as const;
export type ContentUnit = (typeof CONTENT_UNITS)[number];

export const SPEC_SCHEMAS = [
  "sleeve",
  "deckbox",
  "playmat",
  "booster",
  "binder",
  "generic",
] as const;

export type SpecSchema = (typeof SPEC_SCHEMAS)[number];

export const ASSET_PACKAGE_KINDS = [
  "images",
  "pdf",
  "rules",
  "decklist",
  "marketing_kit",
  "release_notes",
  "press_kit",
  "videos",
  "icons",
  "logos",
  "banners",
  "social",
  "editorial",
] as const;

export type AssetPackageKind = (typeof ASSET_PACKAGE_KINDS)[number];

/** Navigation taxonomy nodes. */
export interface TaxonomyPath {
  publisher?: string;
  game?: string;
  category?: string;
  subcategory?: string;
  productFamily?: string;
  productId?: string;
  variantId?: string;
}
