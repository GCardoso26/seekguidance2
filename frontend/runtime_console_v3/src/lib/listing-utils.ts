import type { CardListing } from "@/types/card";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** ID do produto no marketplace shop (store_products). */
export function getListingProductId(listing: CardListing): string | null {
  if (listing.productId) return listing.productId;
  if (listing.id.startsWith("market-")) return null;
  if (UUID_RE.test(listing.id)) return listing.id;
  return null;
}

export function isListingPurchasable(listing: CardListing): boolean {
  return Boolean(getListingProductId(listing)) && listing.quantity > 0;
}
