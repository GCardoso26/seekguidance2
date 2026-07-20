import type { Pool, PoolClient } from "pg";

export interface ListingPublicDTO {
  id: string;
  sellerId: string;
  subjectType: string;
  productVariantId: string | null;
  catalogVariantId: string | null;
  priceCents: number;
  currency: string;
  condition: string;
  quantity: number;
  status: string;
  inventoryStockUnitId: string | null;
}

/**
 * Public read API for Marketplace — Checkout may call this; never SQL marketplace.* from Checkout.
 */
export class ListingPublicQuery {
  constructor(private readonly db: Pool | PoolClient) {}

  async getListing(listingId: string): Promise<ListingPublicDTO | null> {
    const res = await this.db.query(
      `
      SELECT id, seller_id, subject_type, product_variant_id, catalog_variant_id,
             price_cents, currency, condition, quantity, status, inventory_stock_unit_id
      FROM marketplace.listings
      WHERE id = $1
      `,
      [listingId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      sellerId: row.seller_id,
      subjectType: row.subject_type,
      productVariantId: row.product_variant_id,
      catalogVariantId: row.catalog_variant_id,
      priceCents: Number(row.price_cents),
      currency: row.currency,
      condition: row.condition,
      quantity: Number(row.quantity),
      status: row.status,
      inventoryStockUnitId: row.inventory_stock_unit_id,
    };
  }
}

export function createListingPublicQuery(db: Pool | PoolClient): ListingPublicQuery {
  return new ListingPublicQuery(db);
}
