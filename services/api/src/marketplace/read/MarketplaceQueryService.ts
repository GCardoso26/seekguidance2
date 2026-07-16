import type { TransactionManager } from "../../platform/transaction/types.js";
import type { ListingRepository } from "../domain/ListingRepository.js";
import type { SellerRepository } from "../domain/SellerRepository.js";
import type { Listing, Seller } from "../domain/models.js";

/**
 * Frozen read-only contract for /api/v1/marketplace.
 * Returns domain aggregates (mapped to DTOs at the HTTP edge).
 * Only "active" listings are exposed as public offers.
 */
export interface MarketplaceQueryService {
  getSeller(id: string): Promise<Seller | null>;
  getSellerBySlug(slug: string): Promise<Seller | null>;
  listSellerListings(sellerId: string): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  /** Public offers for a catalog card (active only). */
  listCardOffers(catalogCardId: string): Promise<Listing[]>;
}

export class RepositoryMarketplaceQueryService implements MarketplaceQueryService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly sellers: SellerRepository,
    private readonly listings: ListingRepository,
  ) {}

  getSeller(id: string): Promise<Seller | null> {
    return this.tx.runInTransaction((t) => this.sellers.findById(t, id));
  }

  getSellerBySlug(slug: string): Promise<Seller | null> {
    return this.tx.runInTransaction((t) => this.sellers.findBySlug(t, slug));
  }

  listSellerListings(sellerId: string): Promise<Listing[]> {
    return this.tx.runInTransaction((t) => this.listings.listBySeller(t, sellerId));
  }

  getListing(id: string): Promise<Listing | null> {
    return this.tx.runInTransaction((t) => this.listings.findById(t, id));
  }

  async listCardOffers(catalogCardId: string): Promise<Listing[]> {
    const all = await this.tx.runInTransaction((t) =>
      this.listings.listByCatalogCard(t, catalogCardId),
    );
    return all
      .filter((l) => l.status === "active")
      .sort((a, b) => a.priceCents - b.priceCents);
  }
}
