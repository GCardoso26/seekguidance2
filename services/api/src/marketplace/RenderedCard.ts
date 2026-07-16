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
