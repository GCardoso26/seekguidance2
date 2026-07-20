import type { Pool } from "pg";
import { createInventoryService } from "../../inventory/public.js";
import { createPricingService } from "../../pricing/public.js";
import { createListingPublicQuery } from "../../marketplace/public.js";
import {
  createSagaOrchestrator,
  type SagaDefinition,
} from "../../platform/saga/SagaOrchestrator.js";
import { createLogger } from "../../platform/logging/logger.js";
import type { Cart, CartItem } from "../domain/types.js";
import { cartSubtotalCents } from "../domain/types.js";
import { createCouponEngine } from "../domain/CouponEngine.js";
import type { CheckoutRepository } from "../persistence/CheckoutRepository.js";
import type { PaymentGateway } from "./payment/PaymentGateway.js";

const log = createLogger("checkout.saga");

export interface CheckoutSagaContext extends Record<string, unknown> {
  requestId: string;
  sessionId: string;
  cartId: string;
  buyerId: string;
  couponCode: string | null;
  cartItems: Array<{
    listingId: string;
    quantity: number;
    stockUnitId: string | null;
    productVariantId: string | null;
    catalogVariantId: string | null;
    priceSnapshotCents: number;
  }>;
  reservationIds?: string[];
  subtotalCents?: number;
  discountCents?: number;
  totalCents?: number;
  pricingSnapshot?: Record<string, unknown>;
  paymentIntentId?: string;
  paymentClientSecret?: string;
}

export function buildStartCheckoutSagaDefinition(deps: {
  pool: Pool;
  repo: CheckoutRepository;
  payment: PaymentGateway;
  /** Tests: fail fast without backoff sleep. */
  maxAttempts?: number;
}): SagaDefinition<CheckoutSagaContext> {
  const inventory = createInventoryService(deps.pool);
  const pricing = createPricingService(deps.pool);
  const listings = createListingPublicQuery(deps.pool);
  const coupons = createCouponEngine();
  const maxAttempts = deps.maxAttempts ?? 3;

  return {
    sagaType: "StartCheckout",
    steps: [
      {
        name: "ValidateCart",
        maxAttempts: 1,
        execute: async (ctx) => {
          if (!ctx.cartItems.length) throw new Error("cart_empty");
          for (const item of ctx.cartItems) {
            const listing = await listings.getListing(item.listingId);
            if (!listing) throw new Error(`listing_not_found:${item.listingId}`);
            if (listing.status !== "active") throw new Error(`listing_not_active:${item.listingId}`);
            if (listing.quantity < item.quantity) {
              throw new Error(`listing_insufficient_qty:${item.listingId}`);
            }
          }
          await deps.repo.updateSession(ctx.sessionId, { status: "validating" });
          return {};
        },
      },
      {
        name: "HoldInventory",
        maxAttempts,
        execute: async (ctx) => {
          const reservationIds: string[] = [];
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
          for (const item of ctx.cartItems) {
            let stockUnitId = item.stockUnitId;
            if (!stockUnitId) {
              const listing = await listings.getListing(item.listingId);
              stockUnitId = listing?.inventoryStockUnitId ?? null;
            }
            if (!stockUnitId) {
              throw new Error(`stock_unit_missing:${item.listingId}`);
            }
            const { reservationId } = await inventory.hold({
              stockUnitId,
              quantity: item.quantity,
              cartId: ctx.cartId,
              expiresAt,
              requestId: ctx.requestId,
            });
            reservationIds.push(reservationId);
          }
          await deps.repo.updateSession(ctx.sessionId, {
            status: "reserved",
            reservationIds,
          });
          return { reservationIds };
        },
        compensate: async (ctx, stepOutput) => {
          const ids =
            (stepOutput.reservationIds as string[] | undefined) ??
            (ctx.reservationIds as string[] | undefined) ??
            [];
          for (const id of [...ids].reverse()) {
            try {
              await inventory.release(id, ctx.requestId);
            } catch (e) {
              log.error(
                { reservationId: id, err: e instanceof Error ? e.message : String(e) },
                "checkout_release_failed",
              );
            }
          }
        },
      },
      {
        name: "RefreshPricing",
        maxAttempts,
        execute: async (ctx) => {
          const snapshot: Record<string, unknown> = {};
          let subtotal = 0;
          for (const item of ctx.cartItems) {
            const subjectId = item.productVariantId ?? item.catalogVariantId;
            let unit = item.priceSnapshotCents;
            if (subjectId) {
              const subjectType = item.productVariantId ? "product_variant" : "catalog_variant";
              try {
                const valuation = await pricing.getValuation(subjectType, subjectId, "BRL");
                if (valuation?.suggestedPriceCents != null) {
                  unit = valuation.suggestedPriceCents;
                  snapshot[item.listingId] = {
                    suggested: valuation.suggestedPriceCents,
                    avg: valuation.avgPriceCents,
                    source: "pricing.getValuation",
                  };
                } else {
                  snapshot[item.listingId] = { suggested: unit, source: "cart_snapshot" };
                }
              } catch {
                snapshot[item.listingId] = { suggested: unit, source: "cart_snapshot_fallback" };
              }
            } else {
              snapshot[item.listingId] = { suggested: unit, source: "cart_snapshot" };
            }
            subtotal += unit * item.quantity;
          }
          await deps.repo.updateSession(ctx.sessionId, {
            status: "priced",
            subtotalCents: subtotal,
            pricingSnapshot: snapshot,
          });
          return { subtotalCents: subtotal, pricingSnapshot: snapshot };
        },
      },
      {
        name: "ApplyCoupon",
        maxAttempts: 1,
        execute: async (ctx) => {
          const subtotal = Number(ctx.subtotalCents ?? 0);
          const sellerIds = [
            ...new Set(
              (
                await Promise.all(
                  ctx.cartItems.map(async (i) => {
                    const l = await listings.getListing(i.listingId);
                    return l?.sellerId ?? null;
                  }),
                )
              ).filter((s): s is string => Boolean(s)),
            ),
          ];
          let coupon = null;
          if (ctx.couponCode) {
            coupon = await deps.repo.getCouponDefinition(ctx.couponCode);
            if (!coupon || !coupon.active) throw new Error(`coupon_invalid:${ctx.couponCode}`);
          }
          const applied = coupons.apply(coupon, { subtotalCents: subtotal, sellerIds });
          if (!applied.ok) throw new Error(applied.code ?? "coupon_invalid");
          await deps.repo.updateSession(ctx.sessionId, {
            discountCents: applied.discountCents,
            totalCents: applied.totalCents,
          });
          return {
            discountCents: applied.discountCents,
            totalCents: applied.totalCents,
            freeShipping: applied.freeShipping,
          };
        },
      },
      {
        name: "CreatePaymentIntent",
        maxAttempts,
        execute: async (ctx) => {
          const total = Number(ctx.totalCents ?? 0);
          if (total <= 0) throw new Error("checkout_total_invalid");
          const pi = await deps.payment.createPaymentIntent({
            amountCents: total,
            currency: "BRL",
            sessionId: ctx.sessionId,
            buyerId: ctx.buyerId,
          });
          await deps.repo.insertPaymentIntent({
            sessionId: ctx.sessionId,
            amountCents: pi.amountCents,
            currency: pi.currency,
            externalId: pi.externalId,
            clientSecret: pi.clientSecret,
          });
          await deps.repo.updateSession(ctx.sessionId, {
            status: "payment_pending",
            paymentIntentId: pi.externalId,
          });
          return {
            paymentIntentId: pi.externalId,
            paymentClientSecret: pi.clientSecret,
          };
        },
      },
      {
        name: "PersistCheckoutSession",
        maxAttempts: 1,
        execute: async (ctx) => {
          // Session already updated stepwise; final sanity check
          const session = await deps.repo.findSession(ctx.sessionId);
          if (!session) throw new Error("checkout_session_not_found");
          if (!session.paymentIntentId) throw new Error("payment_intent_missing");
          return {};
        },
      },
    ],
  };
}

export function cartItemsToSagaPayload(cart: Cart): CheckoutSagaContext["cartItems"] {
  return cart.items.map((i: CartItem) => ({
    listingId: i.listingId,
    quantity: i.quantity,
    stockUnitId: i.stockUnitId,
    productVariantId: i.productVariantId,
    catalogVariantId: i.catalogVariantId,
    priceSnapshotCents: i.priceSnapshotCents,
  }));
}

export async function runStartCheckoutSaga(deps: {
  pool: Pool;
  repo: CheckoutRepository;
  payment: PaymentGateway;
  context: CheckoutSagaContext;
  correlationId: string;
  maxAttempts?: number;
}): Promise<{ sagaId: string; status: string; context: CheckoutSagaContext; error?: string }> {
  const saga = createSagaOrchestrator(deps.pool);
  const definition = buildStartCheckoutSagaDefinition({
    pool: deps.pool,
    repo: deps.repo,
    payment: deps.payment,
    maxAttempts: deps.maxAttempts,
  });
  // seed subtotal from cart snapshots before pricing refresh
  const seedSubtotal = cartSubtotalCents({
    id: deps.context.cartId,
    buyerId: deps.context.buyerId,
    status: "open",
    items: deps.context.cartItems.map((i) => ({
      id: i.listingId,
      cartId: deps.context.cartId,
      listingId: i.listingId,
      productVariantId: i.productVariantId,
      catalogVariantId: i.catalogVariantId,
      sellerId: null,
      stockUnitId: i.stockUnitId,
      quantity: i.quantity,
      priceSnapshotCents: i.priceSnapshotCents,
      currency: "BRL",
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const result = await saga.run(
    definition,
    { ...deps.context, subtotalCents: seedSubtotal },
    { correlationId: deps.correlationId, requestId: deps.context.requestId },
  );
  return {
    sagaId: result.sagaId,
    status: result.status,
    context: result.context as CheckoutSagaContext,
    error: result.error,
  };
}
