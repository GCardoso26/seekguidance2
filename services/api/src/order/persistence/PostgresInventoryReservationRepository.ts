import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { assertReservationTransition } from "../reservation/domain/ReservationPolicy.js";
import type {
  CreateReservationInput,
  InventoryReservationRepository,
} from "../domain/InventoryReservationRepository.js";
import type { InventoryReservation, ReservationStatus } from "../domain/models.js";

/**
 * Postgres inventory reservations.
 * Concurrency: pg_advisory_xact_lock on inventory_item_id (Sprint 5.3).
 */
export class PostgresInventoryReservationRepository
  implements InventoryReservationRepository
{
  async lockInventoryItem(tx: TxContext, inventoryItemId: string): Promise<void> {
    const client = requirePostgresClient(tx);
    // Transaction-scoped advisory lock — serializes holds for the same item.
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [
      inventoryItemId,
    ]);
  }

  async create(tx: TxContext, input: CreateReservationInput): Promise<InventoryReservation> {
    const client = requirePostgresClient(tx);
    if (input.quantity <= 0) throw new Error("reservation_quantity_invalid");
    const id = input.id ?? getIdGenerator().generate();
    const now = getClock().now();
    const expiresAt = new Date(now.getTime() + input.ttlMs);
    try {
      const res = await client.query(
        `
        INSERT INTO reservation.inventory_reservations
          (id, listing_id, inventory_item_id, buyer_id, quantity, status, expires_at, row_version, request_id)
        VALUES ($1, $2, $3, $4, $5, 'HELD', $6, 1, $7)
        RETURNING *
        `,
        [
          id,
          input.listingId,
          input.inventoryItemId,
          input.buyerId,
          input.quantity,
          expiresAt.toISOString(),
          input.requestId ?? null,
        ],
      );
      return mapReservation(res.rows[0]);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        throw new Error(`reservation_request_id_duplicate:${input.requestId ?? id}`);
      }
      throw err;
    }
  }

  async findById(tx: TxContext, id: string): Promise<InventoryReservation | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM reservation.inventory_reservations WHERE id = $1`,
      [id],
    );
    return res.rows[0] ? mapReservation(res.rows[0]) : null;
  }

  async findByRequestId(
    tx: TxContext,
    requestId: string,
  ): Promise<InventoryReservation | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM reservation.inventory_reservations WHERE request_id = $1`,
      [requestId],
    );
    return res.rows[0] ? mapReservation(res.rows[0]) : null;
  }

  async updateStatus(
    tx: TxContext,
    id: string,
    status: ReservationStatus,
    expectedVersion?: number,
  ): Promise<InventoryReservation> {
    const client = requirePostgresClient(tx);
    const existing = await this.findById(tx, id);
    if (!existing) throw new Error("reservation_not_found");
    if (expectedVersion != null && existing.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:reservation:${id}`);
    }
    assertReservationTransition(existing.status, status);
    const res = await client.query(
      `
      UPDATE reservation.inventory_reservations
      SET status = $2, row_version = row_version + 1, updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, status],
    );
    return mapReservation(res.rows[0]);
  }

  async heldQuantityForInventory(tx: TxContext, inventoryItemId: string): Promise<number> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT COALESCE(SUM(quantity), 0)::int AS held
      FROM reservation.inventory_reservations
      WHERE inventory_item_id = $1
        AND status = 'HELD'
        AND expires_at > now()
      `,
      [inventoryItemId],
    );
    return Number(res.rows[0]?.held ?? 0);
  }

  async reservedQuantityForInventory(
    tx: TxContext,
    inventoryItemId: string,
  ): Promise<number> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT COALESCE(SUM(quantity), 0)::int AS reserved
      FROM reservation.inventory_reservations
      WHERE inventory_item_id = $1
        AND (
          status = 'CONFIRMED'
          OR (status = 'HELD' AND expires_at > now())
        )
      `,
      [inventoryItemId],
    );
    return Number(res.rows[0]?.reserved ?? 0);
  }

  async listExpiredHeld(tx: TxContext, now: Date): Promise<InventoryReservation[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT * FROM reservation.inventory_reservations
      WHERE status = 'HELD'
        AND expires_at <= $1
      ORDER BY expires_at ASC
      `,
      [now.toISOString()],
    );
    return res.rows.map(mapReservation);
  }
}

function mapReservation(row: Record<string, unknown>): InventoryReservation {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    inventoryItemId: String(row.inventory_item_id),
    buyerId: String(row.buyer_id),
    quantity: Number(row.quantity),
    status: row.status as ReservationStatus,
    expiresAt: new Date(String(row.expires_at)),
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
