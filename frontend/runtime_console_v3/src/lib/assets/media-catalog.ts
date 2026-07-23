/**
 * Asset Pipeline V2 — FE media catalog (mirrors Assets BC public API).
 * UX/UI only — no new BC.
 */

export const MEDIA_TYPES = [
  "CARD",
  "CARD_ART",
  "CARD_FULL",
  "SET_LOGO",
  "SET_BANNER",
  "SET_BACKGROUND",
  "SET_KEY_ART",
  "SET_WALLPAPER",
  "SET_ICON",
  "SEALED_PRODUCT",
  "SEALED_GALLERY",
  "ACCESSORY",
  "ACCESSORY_GALLERY",
  "ACCESSORY_LIFESTYLE",
  "ACCESSORY_TRANSPARENT",
  "HERO",
  "GAME_HERO",
  "GAME_HERO_MOBILE",
  "HERO_OVERLAY",
  "HERO_FALLBACK",
  "PROFILE_BANNER",
  "DECK_COVER",
  "DECK_BANNER",
  "DECK_THUMB",
  "MARKETPLACE_CARD",
  "NEWS_IMAGE",
  "EVENT_IMAGE",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const SEALED_GALLERY_SHOTS = [
  "front",
  "back",
  "side",
  "open",
  "contents",
  "zoom",
] as const;

export type SealedGalleryShot = (typeof SEALED_GALLERY_SHOTS)[number];

export const SEALED_GALLERY_LABELS: Record<SealedGalleryShot, string> = {
  front: "Frente",
  back: "Verso",
  side: "Lateral",
  open: "Aberta",
  contents: "Conteúdo",
  zoom: "Zoom",
};

export const ACCESSORY_KINDS = [
  "sleeves",
  "perfect_fit",
  "outer_sleeves",
  "deck_box",
  "deck_case",
  "storage_box",
  "binder",
  "portfolio",
  "playmat",
  "playmat_tube",
  "dice",
  "dice_tray",
  "life_counter",
  "damage_counter",
  "token",
  "tokens",
  "divider",
  "top_loader",
  "magnetic_case",
  "display_stand",
  "mini_snap",
  "booster_storage",
  "acrylic_box",
  "board_game_accessories",
  "other",
] as const;

export type AccessoryKind = (typeof ACCESSORY_KINDS)[number];

export const CARD_IMAGE_SIZES = {
  thumb: { width: 120, height: 170 },
  small: { width: 240, height: 340 },
  medium: { width: 420, height: 560 },
  large: { width: 800, height: 1120 },
  full: { width: 1200, height: 1680 },
} as const;

export const PRODUCT_IMAGE_SIZES = {
  thumb: { width: 240, height: 240 },
  medium: { width: 420, height: 560 },
  square: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 },
} as const;

export const HERO_IMAGE_SIZES = {
  desktop: { width: 1920, height: 700 },
  wide: { width: 1600, height: 600 },
  tablet: { width: 1200, height: 500 },
  mobile: { width: 768, height: 900 },
} as const;

export const BANNER_IMAGE_SIZES = {
  desktop: { width: 1920, height: 400 },
  wide: { width: 1600, height: 350 },
  tablet: { width: 1200, height: 300 },
} as const;

export type CardSizeKey = keyof typeof CARD_IMAGE_SIZES;

export const DEFAULT_SIZES_ATTR: Record<MediaType | "default", string> = {
  default: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  CARD: "(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 240px",
  CARD_ART: "(max-width: 640px) 50vw, 320px",
  CARD_FULL: "(max-width: 768px) 90vw, 420px",
  SET_LOGO: "96px",
  SET_BANNER: "100vw",
  SET_BACKGROUND: "100vw",
  SET_KEY_ART: "(max-width: 768px) 100vw, 800px",
  SET_WALLPAPER: "100vw",
  SET_ICON: "48px",
  SEALED_PRODUCT: "(max-width: 640px) 45vw, 280px",
  SEALED_GALLERY: "(max-width: 640px) 90vw, 420px",
  ACCESSORY: "(max-width: 640px) 45vw, 280px",
  ACCESSORY_GALLERY: "(max-width: 640px) 90vw, 420px",
  ACCESSORY_LIFESTYLE: "(max-width: 768px) 100vw, 800px",
  ACCESSORY_TRANSPARENT: "(max-width: 640px) 50vw, 320px",
  HERO: "100vw",
  GAME_HERO: "100vw",
  GAME_HERO_MOBILE: "100vw",
  HERO_OVERLAY: "100vw",
  HERO_FALLBACK: "100vw",
  PROFILE_BANNER: "100vw",
  DECK_COVER: "(max-width: 640px) 45vw, 280px",
  DECK_BANNER: "100vw",
  DECK_THUMB: "96px",
  MARKETPLACE_CARD: "(max-width: 640px) 45vw, 280px",
  NEWS_IMAGE: "(max-width: 768px) 100vw, 640px",
  EVENT_IMAGE: "(max-width: 768px) 100vw, 640px",
};
