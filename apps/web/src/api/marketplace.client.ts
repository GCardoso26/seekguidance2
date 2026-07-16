import type { HttpClient } from "@/src/api/client";
import type {
  CardOffersResponse,
  CreateInventoryInput,
  CreateListingInput,
  InventoryWriteResponse,
  ListingResponse,
  OnboardSellerInput,
  SellerOnboardResponse,
  SellerResponse,
} from "@/src/types/api";

export interface MarketplaceApiClient {
  onboardSeller(input: OnboardSellerInput): Promise<SellerOnboardResponse>;
  createInventory(input: CreateInventoryInput): Promise<InventoryWriteResponse>;
  createListing(input: CreateListingInput): Promise<ListingResponse>;
  updateListing(
    listingId: string,
    patch: Partial<CreateListingInput> & { status?: string },
  ): Promise<ListingResponse>;
  deleteListing(listingId: string): Promise<{ id: string; status: string }>;
  getOffers(cardId: string): Promise<CardOffersResponse>;
  listOffersByCard(cardId: string): Promise<{ items: ListingResponse[] }>;
  getSeller(sellerId: string): Promise<SellerResponse>;
  listSellerListings(sellerId: string): Promise<{ items: ListingResponse[] }>;
}

/**
 * Publish path used by Seller Wizard:
 * createInventory → createListing (IDs resolved via Public API variants — never typed by user).
 */
export async function publishListingWithInventory(
  api: MarketplaceApiClient,
  input: CreateListingInput,
): Promise<ListingResponse> {
  const inv = await api.createInventory({
    catalogCardId: input.catalogCardId,
    catalogVariantId: input.catalogVariantId,
    quantity: input.quantity,
  });
  return api.createListing({
    ...input,
    inventoryItemId: inv.id,
    status: input.status ?? "active",
  });
}

export function createMarketplaceApiClient(http: HttpClient): MarketplaceApiClient {
  return {
    onboardSeller(input) {
      return http.post<SellerOnboardResponse>("/api/v1/marketplace/sellers", input);
    },

    createInventory(input) {
      return http.post<InventoryWriteResponse>("/api/v1/marketplace/inventory", input);
    },

    createListing(input) {
      return http.post<ListingResponse>("/api/v1/marketplace/listings", input);
    },

    updateListing(listingId, patch) {
      return http.patch<ListingResponse>(
        `/api/v1/marketplace/listings/${encodeURIComponent(listingId)}`,
        patch,
      );
    },

    deleteListing(listingId) {
      return http.delete<{ id: string; status: string }>(
        `/api/v1/marketplace/listings/${encodeURIComponent(listingId)}`,
      );
    },

    getOffers(cardId) {
      return http.get<CardOffersResponse>(
        `/api/v1/marketplace/cards/${encodeURIComponent(cardId)}/offers`,
        { auth: false },
      );
    },

    listOffersByCard(cardId) {
      return http.get<{ items: ListingResponse[] }>(
        `/api/v1/marketplace/listings?cardId=${encodeURIComponent(cardId)}`,
        { auth: false },
      );
    },

    getSeller(sellerId) {
      return http.get<SellerResponse>(
        `/api/v1/marketplace/sellers/${encodeURIComponent(sellerId)}`,
        { auth: false },
      );
    },

    listSellerListings(sellerId) {
      return http.get<{ items: ListingResponse[] }>(
        `/api/v1/marketplace/sellers/${encodeURIComponent(sellerId)}/listings`,
        { auth: false },
      );
    },
  };
}
