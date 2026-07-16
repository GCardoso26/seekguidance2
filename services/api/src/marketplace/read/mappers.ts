import type { Listing, Seller } from "../domain/models.js";
import type { CardOffersResponse, ListingResponse, SellerResponse } from "./dto.js";

export function toSellerResponse(seller: Seller): SellerResponse {
  return {
    id: seller.id,
    displayName: seller.displayName,
    slug: seller.slug,
    status: seller.status,
    verification: seller.verification,
  };
}

export function toListingResponse(listing: Listing): ListingResponse {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    catalogCardId: listing.catalogCardId,
    catalogVariantId: listing.catalogVariantId,
    priceCents: listing.priceCents,
    currency: listing.currency,
    condition: listing.condition,
    language: listing.language,
    finish: listing.finish,
    notes: listing.notes,
    quantity: listing.quantity,
    status: listing.status,
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export function toCardOffersResponse(
  catalogCardId: string,
  listings: Listing[],
): CardOffersResponse {
  const offers = listings.map(toListingResponse);
  const prices = offers.map((o) => o.priceCents).filter((p) => p >= 0);
  return {
    catalogCardId,
    offerCount: offers.length,
    bestPriceCents: prices.length ? Math.min(...prices) : null,
    currency: "BRL",
    offers,
  };
}
