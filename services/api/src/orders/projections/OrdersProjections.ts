import type { Pool } from "pg";
import type { PlatformDomainEvent } from "../../platform/events/DomainEvent.js";
import type { ProjectionConsumer } from "../../platform/projections/ProjectionWorker.js";
import type { Order } from "../domain/types.js";

function asOrderPayload(event: PlatformDomainEvent): {
  buyerId?: string;
  sellerId?: string | null;
  totalAmountCents?: number;
  totalCents?: number;
  status?: string;
} {
  return event.payload as {
    buyerId?: string;
    sellerId?: string | null;
    totalAmountCents?: number;
    totalCents?: number;
    status?: string;
  };
}

/** Upsert helpers used by all order projections. */
export async function projectOrderRow(
  pool: Pool,
  order: {
    orderId: string;
    buyerId: string;
    sellerId: string | null;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: Date;
  },
): Promise<void> {
  if (order.sellerId) {
    await pool.query(
      `
      INSERT INTO orders.proj_seller_orders (
        seller_id, order_id, buyer_id, status, total_cents, currency, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7, now())
      ON CONFLICT (seller_id, order_id) DO UPDATE SET
        status = EXCLUDED.status, updated_at = now()
      `,
      [
        order.sellerId,
        order.orderId,
        order.buyerId,
        order.status,
        order.totalCents,
        order.currency,
        order.createdAt.toISOString(),
      ],
    );
  }

  await pool.query(
    `
    INSERT INTO orders.proj_buyer_orders (
      buyer_id, order_id, seller_id, status, total_cents, currency, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7, now())
    ON CONFLICT (buyer_id, order_id) DO UPDATE SET
      status = EXCLUDED.status, updated_at = now()
    `,
    [
      order.buyerId,
      order.orderId,
      order.sellerId,
      order.status,
      order.totalCents,
      order.currency,
      order.createdAt.toISOString(),
    ],
  );

  await pool.query(
    `
    INSERT INTO orders.proj_recent_orders (
      order_id, buyer_id, seller_id, status, total_cents, currency, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status
    `,
    [
      order.orderId,
      order.buyerId,
      order.sellerId,
      order.status,
      order.totalCents,
      order.currency,
      order.createdAt.toISOString(),
    ],
  );
}

export class SellerOrdersProjection implements ProjectionConsumer {
  readonly name = "SellerOrdersProjection";
  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return event.aggregateType === "order" && event.eventType.startsWith("Order");
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const p = asOrderPayload(event);
    if (!p.sellerId || !p.buyerId) return;
    await projectOrderRow(this.pool, {
      orderId: event.aggregateId,
      buyerId: p.buyerId,
      sellerId: p.sellerId,
      status: p.status ?? inferStatus(event.eventType),
      totalCents: p.totalAmountCents ?? p.totalCents ?? 0,
      currency: "BRL",
      createdAt: event.occurredAt,
    });
  }
}

export class BuyerOrdersProjection implements ProjectionConsumer {
  readonly name = "BuyerOrdersProjection";
  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return event.aggregateType === "order" && event.eventType.startsWith("Order");
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const p = asOrderPayload(event);
    if (!p.buyerId) return;
    await projectOrderRow(this.pool, {
      orderId: event.aggregateId,
      buyerId: p.buyerId,
      sellerId: p.sellerId ?? null,
      status: p.status ?? inferStatus(event.eventType),
      totalCents: p.totalAmountCents ?? p.totalCents ?? 0,
      currency: "BRL",
      createdAt: event.occurredAt,
    });
  }
}

export class DashboardProjection implements ProjectionConsumer {
  readonly name = "DashboardProjection";
  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return (
      event.eventType === "OrderPaid.v1" ||
      event.eventType === "OrderCreated.v1" ||
      event.eventType === "OrderRefunded.v1"
    );
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const p = asOrderPayload(event);
    const amount = p.totalAmountCents ?? p.totalCents ?? 0;
    if (event.eventType === "OrderCreated.v1") {
      await this.pool.query(
        `UPDATE orders.proj_dashboard SET orders_total = orders_total + 1, updated_at = now() WHERE id = 'global'`,
      );
    }
    if (event.eventType === "OrderPaid.v1") {
      await this.pool.query(
        `
        UPDATE orders.proj_dashboard
        SET orders_paid = orders_paid + 1, gmv_cents = gmv_cents + $1, updated_at = now()
        WHERE id = 'global'
        `,
        [amount],
      );
    }
    if (event.eventType === "OrderRefunded.v1") {
      await this.pool.query(
        `
        UPDATE orders.proj_dashboard
        SET refunded_cents = refunded_cents + $1, updated_at = now()
        WHERE id = 'global'
        `,
        [amount],
      );
    }
  }
}

export class RecentOrdersProjection implements ProjectionConsumer {
  readonly name = "RecentOrdersProjection";
  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return event.aggregateType === "order" && event.eventType.startsWith("Order");
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const p = asOrderPayload(event);
    if (!p.buyerId) return;
    await projectOrderRow(this.pool, {
      orderId: event.aggregateId,
      buyerId: p.buyerId,
      sellerId: p.sellerId ?? null,
      status: p.status ?? inferStatus(event.eventType),
      totalCents: p.totalAmountCents ?? p.totalCents ?? 0,
      currency: "BRL",
      createdAt: event.occurredAt,
    });
  }
}

function inferStatus(eventType: string): string {
  if (eventType.startsWith("OrderPaid")) return "PAID";
  if (eventType.startsWith("OrderProcessing")) return "PROCESSING";
  if (eventType.startsWith("OrderShipped")) return "SHIPPED";
  if (eventType.startsWith("OrderDelivered")) return "DELIVERED";
  if (eventType.startsWith("OrderCancelled")) return "CANCELLED";
  if (eventType.startsWith("OrderRefunded")) return "REFUNDED";
  return "PENDING";
}

export function createOrdersProjectionConsumers(pool: Pool): ProjectionConsumer[] {
  return [
    new SellerOrdersProjection(pool),
    new BuyerOrdersProjection(pool),
    new DashboardProjection(pool),
    new RecentOrdersProjection(pool),
  ];
}

/** Helper for tests / sync project after command */
export async function projectOrderSnapshot(pool: Pool, order: Order): Promise<void> {
  await projectOrderRow(pool, {
    orderId: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    createdAt: order.createdAt,
  });
}
