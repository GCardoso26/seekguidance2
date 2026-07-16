import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { CreateOrderInput, OrderRepository } from "../domain/OrderRepository.js";
import { orderTotalFromItems, type Order, type OrderItem, type OrderStatus } from "../domain/models.js";

export class PostgresOrderRepository implements OrderRepository {
  async create(tx: TxContext, input: CreateOrderInput): Promise<Order> {
    const client = requirePostgresClient(tx);
    if (input.items.length === 0) throw new Error("order_empty");

    const items: OrderItem[] = input.items.map((i) => ({
      id: getIdGenerator().generate(),
      listingId: i.listingId,
      catalogVariantId: i.catalogVariantId,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      currency: i.currency ?? "BRL",
    }));
    const total = orderTotalFromItems(items);
    const id = input.id ?? getIdGenerator().generate();

    await client.query(
      `
      INSERT INTO "order".orders
        (id, buyer_id, checkout_session_id, status, total_amount_cents, currency, row_version)
      VALUES ($1, $2, $3, 'PENDING', $4, $5, 1)
      `,
      [id, input.buyerId, input.checkoutSessionId, total, input.currency ?? "BRL"],
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO "order".order_items
          (id, order_id, listing_id, catalog_variant_id, quantity, unit_price_cents, currency)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          item.id,
          id,
          item.listingId,
          item.catalogVariantId,
          item.quantity,
          item.unitPriceCents,
          item.currency,
        ],
      );
    }

    return (await this.findById(tx, id))!;
  }

  async findById(tx: TxContext, id: string): Promise<Order | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM "order".orders WHERE id = $1`, [id]);
    if (!res.rows[0]) return null;
    const itemsRes = await client.query(
      `SELECT * FROM "order".order_items WHERE order_id = $1 ORDER BY id`,
      [id],
    );
    return mapOrder(res.rows[0], itemsRes.rows.map(mapItem));
  }

  async listByBuyer(tx: TxContext, buyerId: string): Promise<Order[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT * FROM "order".orders
      WHERE buyer_id = $1
      ORDER BY created_at DESC
      `,
      [buyerId],
    );
    const out: Order[] = [];
    for (const row of res.rows) {
      const itemsRes = await client.query(
        `SELECT * FROM "order".order_items WHERE order_id = $1 ORDER BY id`,
        [row.id],
      );
      out.push(mapOrder(row, itemsRes.rows.map(mapItem)));
    }
    return out;
  }

  async updateStatus(
    tx: TxContext,
    id: string,
    status: OrderStatus,
    expectedVersion?: number,
  ): Promise<Order> {
    const client = requirePostgresClient(tx);
    const existing = await this.findById(tx, id);
    if (!existing) throw new Error("order_not_found");
    if (expectedVersion != null && existing.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:order:${id}`);
    }
    await client.query(
      `
      UPDATE "order".orders
      SET status = $2, row_version = row_version + 1, updated_at = now()
      WHERE id = $1
      `,
      [id, status],
    );
    return (await this.findById(tx, id))!;
  }
}

function mapOrder(row: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    checkoutSessionId: String(row.checkout_session_id),
    status: row.status as OrderStatus,
    totalAmountCents: Number(row.total_amount_cents),
    currency: row.currency as "BRL",
    items,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

function mapItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    catalogVariantId: String(row.catalog_variant_id),
    quantity: Number(row.quantity),
    unitPriceCents: Number(row.unit_price_cents),
    currency: row.currency as "BRL",
  };
}
