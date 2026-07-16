/**
 * Catalog (SoT) + Marketplace overlay → Rendered Card (read model only).
 * Never written back to catalog.*.
 */
export interface CatalogCardCore {
  catalogCardId: string;
  name: string;
  setCode?: string;
  setName?: string;
  rarity?: string;
  oracleText?: string;
  imageUrl?: string; // media CDN for official art
}

export interface ListingOverlay {
  listingId: string;
  listingTitle?: string;
  sellerPhotoUrls?: string[];
  priceCents: number;
  currency: "BRL";
  quantity: number;
  condition: string;
  finish?: string;
}

export interface RenderedCard {
  official: CatalogCardCore;
  overlay: ListingOverlay;
  displayName: string;
  displayImages: string[];
  salePriceCents: number;
  saleCurrency: "BRL";
}

export function renderCard(official: CatalogCardCore, overlay: ListingOverlay): RenderedCard {
  const displayImages = [
    ...(overlay.sellerPhotoUrls ?? []),
    ...(official.imageUrl ? [official.imageUrl] : []),
  ];
  return {
    official,
    overlay,
    displayName: overlay.listingTitle?.trim() || official.name,
    displayImages,
    salePriceCents: overlay.priceCents,
    saleCurrency: "BRL",
  };
}

/**
 * Card page read model: one official card (Catalog/Search) + N offers (Marketplace).
 * Assembled at the edge (FE/BFF); never written back to Catalog (ADR-003/ADR-007).
 */
export interface RenderedCardWithOffers {
  official: CatalogCardCore;
  offers: RenderedCard[];
  offerCount: number;
  bestPriceCents: number | null;
  currency: "BRL";
}

export function renderCardWithOffers(
  official: CatalogCardCore,
  overlays: ListingOverlay[],
): RenderedCardWithOffers {
  const offers = overlays.map((o) => renderCard(official, o));
  const prices = offers.map((o) => o.salePriceCents).filter((p) => p >= 0);
  return {
    official,
    offers,
    offerCount: offers.length,
    bestPriceCents: prices.length ? Math.min(...prices) : null,
    currency: "BRL",
  };
}
