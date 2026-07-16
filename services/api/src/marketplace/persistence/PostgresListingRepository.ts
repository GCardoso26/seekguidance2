import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { ListingRepository } from "../domain/ListingRepository.js";
import type { Listing, ListingUpsert } from "../domain/models.js";

export class PostgresListingRepository implements ListingRepository {
  async upsert(tx: TxContext, input: ListingUpsert): Promise<RepositoryResult<Listing>> {
    const client = requirePostgresClient(tx);
    const existing = input.id != null ? await this.findById(tx, input.id) : null;

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:listing:${existing.id}`);
    }

    const next: Listing = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      sellerId: input.sellerId,
      catalogCardId: input.catalogCardId,
      catalogVariantId: input.catalogVariantId,
      inventoryItemId: input.inventoryItemId ?? existing?.inventoryItemId ?? null,
      priceCents: input.priceCents,
      currency: input.currency ?? "BRL",
      condition: input.condition,
      language: input.language,
      notes: input.notes ?? null,
      finish: input.finish ?? null,
      quantity: input.quantity,
      status: input.status ?? existing?.status ?? "draft",
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    if (existing && sameListing(existing, next)) {
      return {
        outcome: "unchanged",
        entity: existing,
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    const res = await client.query(
      `
      INSERT INTO marketplace.listings
        (id, seller_id, catalog_card_id, catalog_variant_id, inventory_item_id,
         price_cents, currency, condition, language, notes, finish, quantity, status, row_version)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET
        seller_id = EXCLUDED.seller_id,
        catalog_card_id = EXCLUDED.catalog_card_id,
        catalog_variant_id = EXCLUDED.catalog_variant_id,
        inventory_item_id = EXCLUDED.inventory_item_id,
        price_cents = EXCLUDED.price_cents,
        currency = EXCLUDED.currency,
        condition = EXCLUDED.condition,
        language = EXCLUDED.language,
        notes = EXCLUDED.notes,
        finish = EXCLUDED.finish,
        quantity = EXCLUDED.quantity,
        status = EXCLUDED.status,
        row_version = marketplace.listings.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        next.id,
        next.sellerId,
        next.catalogCardId,
        next.catalogVariantId,
        next.inventoryItemId,
        next.priceCents,
        next.currency,
        next.condition,
        next.language,
        next.notes,
        next.finish,
        next.quantity,
        next.status,
        next.rowVersion,
      ],
    );
    const entity = mapListing(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<Listing | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM marketplace.listings WHERE id = $1`, [id]);
    return res.rows[0] ? mapListing(res.rows[0]) : null;
  }

  async listByCatalogCard(tx: TxContext, catalogCardId: string): Promise<Listing[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM marketplace.listings WHERE catalog_card_id = $1 ORDER BY price_cents`,
      [catalogCardId],
    );
    return res.rows.map(mapListing);
  }

  async listBySeller(tx: TxContext, sellerId: string): Promise<Listing[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM marketplace.listings WHERE seller_id = $1 ORDER BY created_at`,
      [sellerId],
    );
    return res.rows.map(mapListing);
  }
}

function sameListing(a: Listing, b: Listing): boolean {
  return (
    a.sellerId === b.sellerId &&
    a.catalogCardId === b.catalogCardId &&
    a.catalogVariantId === b.catalogVariantId &&
    a.inventoryItemId === b.inventoryItemId &&
    a.priceCents === b.priceCents &&
    a.currency === b.currency &&
    a.condition === b.condition &&
    a.language === b.language &&
    (a.notes || null) === (b.notes || null) &&
    (a.finish || null) === (b.finish || null) &&
    a.quantity === b.quantity &&
    a.status === b.status
  );
}

function mapListing(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    catalogCardId: String(row.catalog_card_id),
    catalogVariantId: String(row.catalog_variant_id),
    inventoryItemId: row.inventory_item_id != null ? String(row.inventory_item_id) : null,
    priceCents: Number(row.price_cents ?? 0),
    currency: row.currency as "BRL",
    condition: String(row.condition),
    language: String(row.language),
    notes: row.notes != null ? String(row.notes) : null,
    finish: row.finish != null ? String(row.finish) : null,
    quantity: Number(row.quantity ?? 0),
    status: row.status as Listing["status"],
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
