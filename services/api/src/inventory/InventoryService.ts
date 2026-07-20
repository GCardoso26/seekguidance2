import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../shared/ids/IdGenerator.js";
import { appendDomainEvent } from "../platform/events/DomainEventStore.js";

type Q = Pool | PoolClient;

export interface UpsertStockInput {
  storeId: string;
  subjectType: "product_variant" | "catalog_variant" | "store_product";
  subjectId: string;
  condition: string;
  onHand: number;
  sellerProductId?: string;
  requestId?: string;
}

export interface HoldReservationInput {
  stockUnitId: string;
  quantity: number;
  cartId?: string;
  expiresAt?: Date;
  requestId?: string;
}

/**
 * Inventory BC — estoque isolado de seller_products.
 * Reservation → Order → Checkout consomem este domínio.
 */
export class InventoryService {
  constructor(private readonly db: Q) {}

  async upsertStock(input: UpsertStockInput): Promise<string> {
    const id = getIdGenerator().generate();
    const res = await this.db.query<{ id: string; on_hand: number }>(
      `
      INSERT INTO inventory.stock_units (
        id, store_id, subject_type, subject_id, condition, on_hand, seller_product_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (store_id, subject_type, subject_id, condition) DO UPDATE SET
        on_hand = EXCLUDED.on_hand,
        seller_product_id = COALESCE(EXCLUDED.seller_product_id, inventory.stock_units.seller_product_id),
        updated_at = now()
      RETURNING id, on_hand
      `,
      [
        id,
        input.storeId,
        input.subjectType,
        input.subjectId,
        input.condition,
        input.onHand,
        input.sellerProductId ?? null,
      ],
    );
    const unitId = res.rows[0]!.id;
    await this.db.query(
      `
      INSERT INTO inventory.stock_movements (stock_unit_id, kind, delta_on_hand, reason)
      VALUES ($1,'adjust',$2,'upsert')
      `,
      [unitId, input.onHand],
    );
    await appendDomainEvent(this.db, {
      eventType: "StockChanged",
      aggregateType: "stock_unit",
      aggregateId: unitId,
      payload: { onHand: input.onHand, subjectId: input.subjectId },
      metadata: { requestId: input.requestId },
    });
    return unitId;
  }

  async hold(input: HoldReservationInput): Promise<{ reservationId: string }> {
    const client = this.db;
    const unit = await client.query<{ id: string; on_hand: number; reserved: number }>(
      `SELECT id, on_hand, reserved FROM inventory.stock_units WHERE id = $1 FOR UPDATE`,
      [input.stockUnitId],
    );
    const row = unit.rows[0];
    if (!row) throw new Error("stock_unit_not_found");
    const available = row.on_hand - row.reserved;
    if (available < input.quantity) throw new Error("insufficient_stock");

    await client.query(
      `UPDATE inventory.stock_units SET reserved = reserved + $2, updated_at = now() WHERE id = $1`,
      [input.stockUnitId, input.quantity],
    );
    const reservationId = getIdGenerator().generate();
    await client.query(
      `
      INSERT INTO inventory.reservations (id, stock_unit_id, quantity, status, cart_id, expires_at)
      VALUES ($1,$2,$3,'held',$4,$5)
      `,
      [
        reservationId,
        input.stockUnitId,
        input.quantity,
        input.cartId ?? null,
        input.expiresAt?.toISOString() ?? null,
      ],
    );
    await client.query(
      `INSERT INTO inventory.stock_movements (stock_unit_id, kind, delta_reserved, reference_id)
       VALUES ($1,'reserve',$2,$3)`,
      [input.stockUnitId, input.quantity, reservationId],
    );
    await appendDomainEvent(this.db, {
      eventType: "InventoryReserved",
      aggregateType: "reservation",
      aggregateId: reservationId,
      payload: { stockUnitId: input.stockUnitId, quantity: input.quantity },
      metadata: { requestId: input.requestId },
    });
    return { reservationId };
  }

  async release(reservationId: string, requestId?: string): Promise<void> {
    const res = await this.db.query<{ stock_unit_id: string; quantity: number; status: string }>(
      `SELECT stock_unit_id, quantity, status FROM inventory.reservations WHERE id = $1 FOR UPDATE`,
      [reservationId],
    );
    const row = res.rows[0];
    if (!row || row.status !== "held") return;
    await this.db.query(
      `UPDATE inventory.stock_units SET reserved = GREATEST(0, reserved - $2), updated_at = now() WHERE id = $1`,
      [row.stock_unit_id, row.quantity],
    );
    await this.db.query(
      `UPDATE inventory.reservations SET status = 'released', updated_at = now() WHERE id = $1`,
      [reservationId],
    );
    await this.db.query(
      `INSERT INTO inventory.stock_movements (stock_unit_id, kind, delta_reserved, reference_id)
       VALUES ($1,'release',$2,$3)`,
      [row.stock_unit_id, -row.quantity, reservationId],
    );
    await appendDomainEvent(this.db, {
      eventType: "InventoryReleased",
      aggregateType: "reservation",
      aggregateId: reservationId,
      payload: { stockUnitId: row.stock_unit_id },
      metadata: { requestId },
    });
  }

  async confirm(reservationId: string): Promise<void> {
    const res = await this.db.query<{ stock_unit_id: string; quantity: number; status: string }>(
      `SELECT stock_unit_id, quantity, status FROM inventory.reservations WHERE id = $1 FOR UPDATE`,
      [reservationId],
    );
    const row = res.rows[0];
    if (!row || row.status !== "held") throw new Error("reservation_not_held");
    await this.db.query(
      `
      UPDATE inventory.stock_units
      SET on_hand = on_hand - $2, reserved = GREATEST(0, reserved - $2), updated_at = now()
      WHERE id = $1
      `,
      [row.stock_unit_id, row.quantity],
    );
    await this.db.query(
      `UPDATE inventory.reservations SET status = 'confirmed', updated_at = now() WHERE id = $1`,
      [reservationId],
    );
    await this.db.query(
      `INSERT INTO inventory.stock_movements (stock_unit_id, kind, delta_on_hand, delta_reserved, reference_id)
       VALUES ($1,'confirm',$2,$3,$4)`,
      [row.stock_unit_id, -row.quantity, -row.quantity, reservationId],
    );
  }
}

export function createInventoryService(db: Pool | PoolClient): InventoryService {
  return new InventoryService(db);
}
