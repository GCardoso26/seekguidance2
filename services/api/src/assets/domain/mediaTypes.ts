/**
 * Asset Pipeline V2 — Media Type Catalog (Assets BC, not a new BC).
 * Single source of truth for media kinds used across portal surfaces.
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

export const MEDIA_TYPE_META: Record<
  MediaType,
  { label: string; defaultAspect: string; surface: string }
> = {
  CARD: { label: "Card", defaultAspect: "63/88", surface: "catalog" },
  CARD_ART: { label: "Card art crop", defaultAspect: "1/1", surface: "catalog" },
  CARD_FULL: { label: "Card full art", defaultAspect: "63/88", surface: "catalog" },
  SET_LOGO: { label: "Set logo", defaultAspect: "1/1", surface: "expansion" },
  SET_BANNER: { label: "Set banner", defaultAspect: "1920/400", surface: "expansion" },
  SET_BACKGROUND: { label: "Set background", defaultAspect: "16/9", surface: "expansion" },
  SET_KEY_ART: { label: "Set key art", defaultAspect: "16/9", surface: "expansion" },
  SET_WALLPAPER: { label: "Set wallpaper", defaultAspect: "16/9", surface: "expansion" },
  SET_ICON: { label: "Set icon", defaultAspect: "1/1", surface: "expansion" },
  SEALED_PRODUCT: { label: "Sealed primary", defaultAspect: "3/4", surface: "marketplace" },
  SEALED_GALLERY: { label: "Sealed gallery", defaultAspect: "3/4", surface: "marketplace" },
  ACCESSORY: { label: "Accessory primary", defaultAspect: "1/1", surface: "marketplace" },
  ACCESSORY_GALLERY: { label: "Accessory gallery", defaultAspect: "1/1", surface: "marketplace" },
  ACCESSORY_LIFESTYLE: { label: "Accessory lifestyle", defaultAspect: "4/3", surface: "marketplace" },
  ACCESSORY_TRANSPARENT: { label: "Accessory PNG/WebP", defaultAspect: "1/1", surface: "marketplace" },
  HERO: { label: "Hero desktop", defaultAspect: "1920/700", surface: "portal" },
  GAME_HERO: { label: "Game hero desktop", defaultAspect: "1920/700", surface: "portal" },
  GAME_HERO_MOBILE: { label: "Game hero mobile", defaultAspect: "768/900", surface: "portal" },
  HERO_OVERLAY: { label: "Hero overlay", defaultAspect: "1920/700", surface: "portal" },
  HERO_FALLBACK: { label: "Hero fallback", defaultAspect: "1920/700", surface: "portal" },
  PROFILE_BANNER: { label: "Profile banner", defaultAspect: "1920/400", surface: "player" },
  DECK_COVER: { label: "Deck cover", defaultAspect: "3/4", surface: "deck" },
  DECK_BANNER: { label: "Deck banner", defaultAspect: "16/9", surface: "deck" },
  DECK_THUMB: { label: "Deck thumbnail", defaultAspect: "1/1", surface: "deck" },
  MARKETPLACE_CARD: { label: "Marketplace card", defaultAspect: "420/560", surface: "marketplace" },
  NEWS_IMAGE: { label: "News", defaultAspect: "16/9", surface: "editorial" },
  EVENT_IMAGE: { label: "Event", defaultAspect: "16/9", surface: "events" },
};

/** Gallery shot labels for sealed products. */
export const SEALED_GALLERY_SHOTS = [
  "front",
  "back",
  "side",
  "open",
  "contents",
  "zoom",
] as const;

export type SealedGalleryShot = (typeof SEALED_GALLERY_SHOTS)[number];

export const ACCESSORY_KINDS = [
  "sleeves",
  "deck_box",
  "binder",
  "playmat",
  "dice",
  "tokens",
  "storage_box",
] as const;

export type AccessoryKind = (typeof ACCESSORY_KINDS)[number];

export function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}
