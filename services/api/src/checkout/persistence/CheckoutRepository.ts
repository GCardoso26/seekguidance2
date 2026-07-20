import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  Cart,
  CartItem,
  CheckoutSession,
  CheckoutSessionStatus,
  Coupon,
} from "../domain/types.js";

type Q = Pool | PoolClient;

function mapItem(row: Record<string, unknown>): CartItem {
  return {
    id: String(row.id),
    cartId: String(row.cart_id),
    listingId: String(row.listing_id),
    productVariantId: row.product_variant_id ? String(row.product_variant_id) : null,
    catalogVariantId: row.catalog_variant_id ? String(row.catalog_variant_id) : null,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    stockUnitId: row.stock_unit_id ? String(row.stock_unit_id) : null,
    quantity: Number(row.quantity),
    priceSnapshotCents: Number(row.price_snapshot_cents),
    currency: String(row.currency),
  };
}

function mapCart(row: Record<string, unknown>, items: CartItem[]): Cart {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    status: row.status as Cart["status"],
    items,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

function mapSession(row: Record<string, unknown>): CheckoutSession {
  const reservations = row.reservation_ids;
  return {
    id: String(row.id),
    cartId: String(row.cart_id),
    buyerId: String(row.buyer_id),
    status: row.status as CheckoutSessionStatus,
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    subtotalCents: Number(row.subtotal_cents),
    discountCents: Number(row.discount_cents),
    totalCents: Number(row.total_cents),
    currency: String(row.currency),
    sagaId: row.saga_id ? String(row.saga_id) : null,
    paymentIntentId: row.payment_intent_id ? String(row.payment_intent_id) : null,
    reservationIds: Array.isArray(reservations)
      ? reservations.map(String)
      : typeof reservations === "string"
        ? (JSON.parse(reservations) as string[])
        : [],
    pricingSnapshot:
      typeof row.pricing_snapshot === "object" && row.pricing_snapshot
        ? (row.pricing_snapshot as Record<string, unknown>)
        : {},
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    error: row.error ? String(row.error) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export class CheckoutRepository {
  constructor(private readonly db: Q) {}

  async createCart(buyerId: string): Promise<Cart> {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO checkout.carts (id, buyer_id, status)
      VALUES ($1, $2, 'open')
      RETURNING *
      `,
      [id, buyerId],
    );
    return mapCart(res.rows[0], []);
  }

  async findCart(cartId: string): Promise<Cart | null> {
    const res = await this.db.query(`SELECT * FROM checkout.carts WHERE id = $1`, [cartId]);
    const row = res.rows[0];
    if (!row) return null;
    const items = await this.db.query(
      `SELECT * FROM checkout.cart_items WHERE cart_id = $1 ORDER BY created_at`,
      [cartId],
    );
    return mapCart(row, items.rows.map(mapItem));
  }

  async findOpenCartByBuyer(buyerId: string): Promise<Cart | null> {
    const res = await this.db.query(
      `SELECT * FROM checkout.carts WHERE buyer_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      [buyerId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return this.findCart(String(row.id));
  }

  async upsertCartItem(input: {
    cartId: string;
    listingId: string;
    productVariantId?: string | null;
    catalogVariantId?: string | null;
    sellerId?: string | null;
    stockUnitId?: string | null;
    quantity: number;
    priceSnapshotCents: number;
    currency?: string;
  }): Promise<CartItem> {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO checkout.cart_items (
        id, cart_id, listing_id, product_variant_id, catalog_variant_id,
        seller_id, stock_unit_id, quantity, price_snapshot_cents, currency
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (cart_id, listing_id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        price_snapshot_cents = EXCLUDED.price_snapshot_cents,
        product_variant_id = COALESCE(EXCLUDED.product_variant_id, checkout.cart_items.product_variant_id),
        catalog_variant_id = COALESCE(EXCLUDED.catalog_variant_id, checkout.cart_items.catalog_variant_id),
        seller_id = COALESCE(EXCLUDED.seller_id, checkout.cart_items.seller_id),
        stock_unit_id = COALESCE(EXCLUDED.stock_unit_id, checkout.cart_items.stock_unit_id)
      RETURNING *
      `,
      [
        id,
        input.cartId,
        input.listingId,
        input.productVariantId ?? null,
        input.catalogVariantId ?? null,
        input.sellerId ?? null,
        input.stockUnitId ?? null,
        input.quantity,
        input.priceSnapshotCents,
        input.currency ?? "BRL",
      ],
    );
    await this.db.query(`UPDATE checkout.carts SET updated_at = now() WHERE id = $1`, [
      input.cartId,
    ]);
    return mapItem(res.rows[0]);
  }

  async removeCartItem(cartId: string, listingId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM checkout.cart_items WHERE cart_id = $1 AND listing_id = $2`,
      [cartId, listingId],
    );
    await this.db.query(`UPDATE checkout.carts SET updated_at = now() WHERE id = $1`, [cartId]);
  }

  async markCartCheckedOut(cartId: string): Promise<void> {
    await this.db.query(
      `UPDATE checkout.carts SET status = 'checked_out', updated_at = now() WHERE id = $1`,
      [cartId],
    );
  }

  async getCoupon(code: string): Promise<Coupon | null> {
    const res = await this.db.query(
      `SELECT code, percent_off, amount_off_cents, active FROM checkout.coupons WHERE code = $1`,
      [code.toUpperCase()],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      code: String(row.code),
      percentOff: row.percent_off != null ? Number(row.percent_off) : null,
      amountOffCents: row.amount_off_cents != null ? Number(row.amount_off_cents) : null,
      active: Boolean(row.active),
    };
  }

  async findSessionByIdempotency(key: string): Promise<CheckoutSession | null> {
    const res = await this.db.query(
      `SELECT * FROM checkout.sessions WHERE idempotency_key = $1`,
      [key],
    );
    return res.rows[0] ? mapSession(res.rows[0]) : null;
  }

  async createSession(input: {
    cartId: string;
    buyerId: string;
    couponCode?: string | null;
    idempotencyKey?: string | null;
  }): Promise<CheckoutSession> {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO checkout.sessions (
        id, cart_id, buyer_id, status, coupon_code, idempotency_key
      ) VALUES ($1,$2,$3,'created',$4,$5)
      RETURNING *
      `,
      [
        id,
        input.cartId,
        input.buyerId,
        input.couponCode ?? null,
        input.idempotencyKey ?? null,
      ],
    );
    return mapSession(res.rows[0]);
  }

  async updateSession(
    sessionId: string,
    patch: {
      status?: CheckoutSessionStatus;
      sagaId?: string;
      subtotalCents?: number;
      discountCents?: number;
      totalCents?: number;
      paymentIntentId?: string;
      reservationIds?: string[];
      pricingSnapshot?: Record<string, unknown>;
      error?: string | null;
    },
  ): Promise<CheckoutSession> {
    const res = await this.db.query(
      `
      UPDATE checkout.sessions SET
        status = COALESCE($2, status),
        saga_id = COALESCE($3, saga_id),
        subtotal_cents = COALESCE($4, subtotal_cents),
        discount_cents = COALESCE($5, discount_cents),
        total_cents = COALESCE($6, total_cents),
        payment_intent_id = COALESCE($7, payment_intent_id),
        reservation_ids = COALESCE($8::jsonb, reservation_ids),
        pricing_snapshot = COALESCE($9::jsonb, pricing_snapshot),
        error = COALESCE($10, error),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        sessionId,
        patch.status ?? null,
        patch.sagaId ?? null,
        patch.subtotalCents ?? null,
        patch.discountCents ?? null,
        patch.totalCents ?? null,
        patch.paymentIntentId ?? null,
        patch.reservationIds != null ? JSON.stringify(patch.reservationIds) : null,
        patch.pricingSnapshot != null ? JSON.stringify(patch.pricingSnapshot) : null,
        patch.error === undefined ? null : patch.error,
      ],
    );
    if (!res.rows[0]) throw new Error("checkout_session_not_found");
    return mapSession(res.rows[0]);
  }

  async findSession(sessionId: string): Promise<CheckoutSession | null> {
    const res = await this.db.query(`SELECT * FROM checkout.sessions WHERE id = $1`, [
      sessionId,
    ]);
    return res.rows[0] ? mapSession(res.rows[0]) : null;
  }

  async insertPaymentIntent(input: {
    sessionId: string;
    amountCents: number;
    currency: string;
    externalId: string;
    clientSecret: string;
  }): Promise<{ id: string; externalId: string; clientSecret: string }> {
    const id = getIdGenerator().generate();
    await this.db.query(
      `
      INSERT INTO checkout.payment_intents (
        id, session_id, provider, external_id, amount_cents, currency, status, client_secret
      ) VALUES ($1,$2,'stub',$3,$4,$5,'pending',$6)
      `,
      [
        id,
        input.sessionId,
        input.externalId,
        input.amountCents,
        input.currency,
        input.clientSecret,
      ],
    );
    return { id, externalId: input.externalId, clientSecret: input.clientSecret };
  }
}
