import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { Order, OrderItem, OrderTimelineEntry, TimelineEventType } from "../domain/types.js";
import type { OrderAggregate } from "../domain/OrderAggregate.js";

type Q = Pool | PoolClient;

function mapItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    listingId: row.listing_id ? String(row.listing_id) : null,
    productVariantId: row.product_variant_id ? String(row.product_variant_id) : null,
    catalogVariantId: row.catalog_variant_id ? String(row.catalog_variant_id) : null,
    quantity: Number(row.quantity),
    unitPriceCents: Number(row.unit_price_cents),
    totalCents: Number(row.total_cents),
    currency: String(row.currency),
  };
}

function mapOrder(row: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: row.seller_id ? String(row.seller_id) : null,
    status: row.status as Order["status"],
    paymentStatus: row.payment_status as Order["paymentStatus"],
    checkoutSessionId: row.checkout_session_id ? String(row.checkout_session_id) : null,
    checkoutPaymentId: row.checkout_payment_id ? String(row.checkout_payment_id) : null,
    currency: String(row.currency),
    subtotalCents: Number(row.subtotal_cents),
    discountCents: Number(row.discount_cents),
    totalCents: Number(row.total_cents),
    shipmentRef: row.shipment_ref ? String(row.shipment_ref) : null,
    items,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export class OrdersRepository {
  constructor(private readonly db: Q) {}

  async findById(orderId: string): Promise<Order | null> {
    const res = await this.db.query(`SELECT * FROM orders.orders WHERE id = $1`, [orderId]);
    const row = res.rows[0];
    if (!row) return null;
    const items = await this.db.query(
      `SELECT * FROM orders.order_items WHERE order_id = $1`,
      [orderId],
    );
    return mapOrder(row, items.rows.map(mapItem));
  }

  async findByCheckoutSession(sessionId: string): Promise<Order | null> {
    const res = await this.db.query(
      `SELECT * FROM orders.orders WHERE checkout_session_id = $1`,
      [sessionId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return this.findById(String(row.id));
  }

  async saveAggregate(agg: OrderAggregate): Promise<Order> {
    const snap = agg.snapshot();
    const existing = await this.findById(snap.id);
    if (!existing) {
      await this.db.query(
        `
        INSERT INTO orders.orders (
          id, buyer_id, seller_id, status, payment_status, checkout_session_id,
          checkout_payment_id, currency, subtotal_cents, discount_cents, total_cents,
          shipment_ref
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `,
        [
          snap.id,
          snap.buyerId,
          snap.sellerId,
          snap.status,
          snap.paymentStatus,
          snap.checkoutSessionId,
          snap.checkoutPaymentId,
          snap.currency,
          snap.subtotalCents,
          snap.discountCents,
          snap.totalCents,
          snap.shipmentRef,
        ],
      );
      for (const item of snap.items) {
        await this.db.query(
          `
          INSERT INTO orders.order_items (
            id, order_id, listing_id, product_variant_id, catalog_variant_id,
            quantity, unit_price_cents, total_cents, currency
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            item.id,
            snap.id,
            item.listingId,
            item.productVariantId,
            item.catalogVariantId,
            item.quantity,
            item.unitPriceCents,
            item.totalCents,
            item.currency,
          ],
        );
      }
    } else {
      await this.db.query(
        `
        UPDATE orders.orders SET
          status = $2, payment_status = $3, shipment_ref = $4, updated_at = now()
        WHERE id = $1
        `,
        [snap.id, snap.status, snap.paymentStatus, snap.shipmentRef],
      );
    }

    for (const ev of agg.drainTimeline()) {
      await this.appendTimeline(snap.id, ev.eventType, ev.payload);
    }
    return (await this.findById(snap.id))!;
  }

  async appendTimeline(
    orderId: string,
    eventType: TimelineEventType,
    payload: Record<string, unknown>,
  ): Promise<OrderTimelineEntry> {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO orders.order_timeline (id, order_id, event_type, payload)
      VALUES ($1,$2,$3,$4::jsonb)
      RETURNING *
      `,
      [id, orderId, eventType, JSON.stringify(payload)],
    );
    const row = res.rows[0];
    return {
      id: String(row.id),
      orderId: String(row.order_id),
      eventType: row.event_type as TimelineEventType,
      payload: (row.payload as Record<string, unknown>) ?? {},
      occurredAt: new Date(String(row.occurred_at)),
    };
  }

  async listTimeline(orderId: string): Promise<OrderTimelineEntry[]> {
    const res = await this.db.query(
      `SELECT * FROM orders.order_timeline WHERE order_id = $1 ORDER BY occurred_at ASC`,
      [orderId],
    );
    return res.rows.map((row) => ({
      id: String(row.id),
      orderId: String(row.order_id),
      eventType: row.event_type as TimelineEventType,
      payload: (row.payload as Record<string, unknown>) ?? {},
      occurredAt: new Date(String(row.occurred_at)),
    }));
  }
}
