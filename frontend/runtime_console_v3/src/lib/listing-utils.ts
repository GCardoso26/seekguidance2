import type { CardListing } from "@/types/card";

/**
 * ID do produto no marketplace shop (`store_products`).
 * Não usa `listing.id` como fallback — UUID de `card_listings` não é válido no carrinho.
 */
export function getListingProductId(listing: CardListing): string | null {
  if (listing.productId && listing.productId.trim()) {
    return listing.productId.trim();
  }
  return null;
}

export function isListingPurchasable(listing: CardListing): boolean {
  return Boolean(getListingProductId(listing)) && listing.quantity > 0;
}
