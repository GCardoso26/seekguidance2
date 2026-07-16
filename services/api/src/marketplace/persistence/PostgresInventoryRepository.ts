import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { InventoryRepository } from "../domain/InventoryRepository.js";
import type { InventoryItem, InventoryItemUpsert } from "../domain/models.js";

export class PostgresInventoryRepository implements InventoryRepository {
  async upsert(
    tx: TxContext,
    input: InventoryItemUpsert,
  ): Promise<RepositoryResult<InventoryItem>> {
    const client = requirePostgresClient(tx);
    const existing =
      (input.id != null ? await this.findById(tx, input.id) : null) ??
      (await this.findBySellerAndVariant(tx, input.sellerId, input.catalogVariantId));

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:inventory:${existing.id}`);
    }

    if (
      existing &&
      existing.quantity === input.quantity &&
      existing.catalogCardId === input.catalogCardId
    ) {
      return {
        outcome: "unchanged",
        entity: existing,
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    const id = existing?.id ?? input.id ?? getIdGenerator().generate();
    const res = await client.query(
      `
      INSERT INTO marketplace.inventory_items
        (id, seller_id, catalog_card_id, catalog_variant_id, quantity, row_version)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (seller_id, catalog_variant_id) DO UPDATE SET
        catalog_card_id = EXCLUDED.catalog_card_id,
        quantity = EXCLUDED.quantity,
        row_version = marketplace.inventory_items.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.sellerId,
        input.catalogCardId,
        input.catalogVariantId,
        input.quantity,
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapInventory(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<InventoryItem | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM marketplace.inventory_items WHERE id = $1`, [id]);
    return res.rows[0] ? mapInventory(res.rows[0]) : null;
  }

  async findBySellerAndVariant(
    tx: TxContext,
    sellerId: string,
    catalogVariantId: string,
  ): Promise<InventoryItem | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM marketplace.inventory_items WHERE seller_id = $1 AND catalog_variant_id = $2`,
      [sellerId, catalogVariantId],
    );
    return res.rows[0] ? mapInventory(res.rows[0]) : null;
  }

  async listBySeller(tx: TxContext, sellerId: string): Promise<InventoryItem[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM marketplace.inventory_items WHERE seller_id = $1 ORDER BY created_at`,
      [sellerId],
    );
    return res.rows.map(mapInventory);
  }
}

function mapInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    catalogCardId: String(row.catalog_card_id),
    catalogVariantId: String(row.catalog_variant_id),
    quantity: Number(row.quantity ?? 0),
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
