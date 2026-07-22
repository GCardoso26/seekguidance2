import type { MediaType } from "@/lib/assets/media-catalog";

/**
 * Maps shop / PDV / master-catalog category strings to Asset Pipeline media types.
 * Unified catalog: CARD | SEALED | ACCESSORY — not separate image systems.
 */
export function mediaTypeFromCategory(category?: string | null): MediaType {
  const c = (category || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!c) return "CARD";

  if (
    c === "CARD" ||
    c === "SINGLE" ||
    c === "SINGLES" ||
    c === "AVULSA" ||
    c === "AVULSAS" ||
    (c.includes("CARD") && !c.includes("CARDGAME"))
  ) {
    return "CARD";
  }

  // Accessories first — "DECK_BOX" contains BOX but is not sealed product.
  if (
    c.includes("SLEEVE") ||
    c.includes("DECK_BOX") ||
    c.includes("DECKBOX") ||
    c.includes("BINDER") ||
    c.includes("PLAYMAT") ||
    c.includes("ACCESSOR") ||
    c.includes("TOPLOADER") ||
    c.includes("DICE") ||
    c === "STORAGE"
  ) {
    return "ACCESSORY";
  }

  if (
    c.includes("SEALED") ||
    c.includes("BOOSTER") ||
    c.includes("STARTER") ||
    c.includes("TROVE") ||
    c.includes("GIFT") ||
    c.includes("BUNDLE") ||
    c.includes("ILLUMINEER") ||
    c.endsWith("_BOX") ||
    c === "BOX"
  ) {
    return "SEALED_PRODUCT";
  }

  return "CARD";
}

/** First usable product image URL (shop/PDV images[] or single image_url). */
export function primaryProductImageUrl(
  images?: Array<string | null | undefined> | null,
  imageUrl?: string | null,
): string | null {
  if (images?.length) {
    for (const u of images) {
      const t = u?.trim();
      if (t) return t;
    }
  }
  const single = imageUrl?.trim();
  return single || null;
}
