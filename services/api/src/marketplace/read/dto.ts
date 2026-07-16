/**
 * Marketplace public read DTOs (/api/v1/marketplace).
 *
 * Reference Catalog IDs only — never expose or copy official card data
 * (name/oracle/artist live in Catalog, served by /api/v1). ADR-007.
 */

export interface SellerResponse {
  id: string;
  displayName: string;
  slug: string;
  status: string;
  verification: string;
}

export interface ListingResponse {
  id: string;
  sellerId: string;
  catalogCardId: string;
  catalogVariantId: string;
  priceCents: number;
  currency: string;
  condition: string;
  language: string;
  finish: string | null;
  notes: string | null;
  quantity: number;
  status: string;
  updatedAt: string;
}

export interface CardOffersResponse {
  catalogCardId: string;
  offerCount: number;
  bestPriceCents: number | null;
  currency: string;
  offers: ListingResponse[];
}
