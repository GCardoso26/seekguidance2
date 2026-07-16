/** Public / marketplace / checkout response shapes used by typed clients. */

export interface CardSummary {
  id: string;
  name: string;
  setCode: string | null;
  setName: string | null;
  language: string;
  rarity: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  currency: string | null;
  hasStock: boolean;
}

export interface CardDetails extends CardSummary {
  oracleText: string | null;
  finishes: string[];
  storeIds: string[];
  stockTotal: number;
  priceMax: number | null;
  updatedAt: string;
  projection: string;
}

export interface SearchResult {
  hits: Array<{ card: CardSummary; score?: number }>;
  estimatedTotal: number;
  tookMs: number;
  query: string | null;
  projection: string;
}

export interface CreateListingInput {
  catalogCardId: string;
  catalogVariantId: string;
  condition: string;
  language?: string;
  priceCents: number;
  quantity: number;
  inventoryItemId?: string | null;
  notes?: string | null;
  finish?: string | null;
  status?: "draft" | "active";
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

/** GET /api/v1/marketplace/cards/:id/offers */
export interface CardOffersResponse {
  catalogCardId: string;
  offerCount: number;
  bestPriceCents: number | null;
  currency: string;
  offers: ListingResponse[];
}

export interface SellerResponse {
  id: string;
  displayName: string;
  slug: string;
  status: string;
  verification: string;
}

export interface VariantSummary {
  id: string;
  cardId: string;
  finish: string;
  language: string;
  name: string;
  setCode: string | null;
  priceMin: number | null;
  currency: string | null;
  hasStock: boolean;
  imageUrl: string | null;
}

export interface InventoryWriteResponse {
  id: string;
  quantity: number;
  outcome: string;
}

export interface CreateInventoryInput {
  catalogCardId: string;
  catalogVariantId: string;
  quantity: number;
}

export interface OnboardSellerInput {
  displayName: string;
  slug?: string;
}

export interface SellerOnboardResponse {
  sellerId: string;
  slug: string;
  displayName: string;
  profileId: string;
}

export interface CartItemResponse {
  id: string;
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  priceSnapshotCents: number;
  currency: "BRL";
}

export interface CartResponse {
  id: string;
  status: "open" | "checked_out" | "abandoned";
  items: CartItemResponse[];
  totalCents: number;
  currency: "BRL";
}

/** UX-only enrichment — never sent to API; hides technical IDs from the cart UI. */
export interface CartItemDisplayMeta {
  listingId: string;
  cardId: string;
  cardName: string;
  storeName: string;
  condition: string;
  language: string;
}

export interface CheckoutResponse {
  checkoutSessionId: string;
  status: string;
  orderId: string | null;
  cartId: string;
}
