import type { Pool } from "pg";
import { createListingPublicQuery } from "../../marketplace/public.js";
import {
  createFeatureFlagService,
  type FeatureFlagService,
  InMemoryFeatureFlagService,
} from "../../platform/feature-flags/FeatureFlagService.js";
import { domainEventFactory } from "../../platform/events/DomainEventFactory.js";
import { PostgresOutboxRepository } from "../../platform/outbox/PostgresOutboxRepository.js";
import { PostgresTransactionManager } from "../../platform/transaction/PostgresTransactionManager.js";
import { createLogger } from "../../platform/logging/logger.js";
import {
  createIdempotentHandler,
  type IdempotentCommandHandler,
} from "../../platform/idempotency/IdempotentCommandHandler.js";
import { CheckoutRepository } from "../persistence/CheckoutRepository.js";
import type { Cart, CheckoutSession } from "../domain/types.js";
import { StubPaymentIntentAdapter } from "./StubPaymentIntentAdapter.js";
import {
  cartItemsToSagaPayload,
  runStartCheckoutSaga,
} from "./CheckoutSaga.js";

const log = createLogger("checkout.service");

export interface AddToCartCommand {
  requestId: string;
  buyerId: string;
  cartId?: string;
  listingId: string;
  quantity: number;
}

export interface StartCheckoutCommand {
  requestId: string;
  correlationId?: string;
  buyerId: string;
  cartId: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export interface StartCheckoutV2Result {
  session: CheckoutSession;
  sagaId: string | null;
  status: string;
  clientSecret: string | null;
  error?: string;
}

/**
 * Checkout BC V2 — cart + saga orchestration.
 * Consumes only Marketplace/Pricing/Inventory public APIs + platform saga/outbox/flags.
 */
export class CheckoutService {
  private readonly repo: CheckoutRepository;
  private readonly payment = new StubPaymentIntentAdapter();
  private readonly flags: FeatureFlagService | InMemoryFeatureFlagService;
  private readonly outbox: PostgresOutboxRepository;
  private readonly tx: PostgresTransactionManager;
  private readonly idempotent: IdempotentCommandHandler;

  constructor(
    private readonly pool: Pool,
    opts?: { flags?: FeatureFlagService | InMemoryFeatureFlagService },
  ) {
    this.repo = new CheckoutRepository(pool);
    this.flags = opts?.flags ?? createFeatureFlagService(pool);
    this.outbox = new PostgresOutboxRepository(pool);
    this.tx = new PostgresTransactionManager(pool);
    this.idempotent = createIdempotentHandler(pool);
  }

  async getOrCreateCart(buyerId: string): Promise<Cart> {
    const existing = await this.repo.findOpenCartByBuyer(buyerId);
    if (existing) return existing;
    return this.repo.createCart(buyerId);
  }

  async getCart(cartId: string, buyerId: string): Promise<Cart> {
    const cart = await this.repo.findCart(cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.buyerId !== buyerId) throw new Error("cart_buyer_mismatch");
    return cart;
  }

  async addToCart(cmd: AddToCartCommand): Promise<Cart> {
    const listings = createListingPublicQuery(this.pool);
    const listing = await listings.getListing(cmd.listingId);
    if (!listing) throw new Error("listing_not_found");
    if (listing.status !== "active") throw new Error("listing_not_active");
    if (cmd.quantity <= 0) throw new Error("quantity_invalid");
    if (listing.quantity < cmd.quantity) throw new Error("listing_insufficient_qty");

    let cart: Cart;
    if (cmd.cartId) {
      cart = await this.getCart(cmd.cartId, cmd.buyerId);
      if (cart.status !== "open") throw new Error("cart_not_open");
    } else {
      cart = await this.getOrCreateCart(cmd.buyerId);
    }

    await this.repo.upsertCartItem({
      cartId: cart.id,
      listingId: listing.id,
      productVariantId: listing.productVariantId,
      catalogVariantId: listing.catalogVariantId,
      sellerId: listing.sellerId,
      stockUnitId: listing.inventoryStockUnitId,
      quantity: cmd.quantity,
      priceSnapshotCents: listing.priceCents,
      currency: listing.currency,
    });

    log.info(
      { requestId: cmd.requestId, cartId: cart.id, listingId: listing.id },
      "checkout_cart_item_added",
    );
    return (await this.repo.findCart(cart.id))!;
  }

  async removeFromCart(buyerId: string, cartId: string, listingId: string): Promise<Cart> {
    await this.getCart(cartId, buyerId);
    await this.repo.removeCartItem(cartId, listingId);
    return (await this.repo.findCart(cartId))!;
  }

  async startCheckout(cmd: StartCheckoutCommand): Promise<StartCheckoutV2Result> {
    const enabled = await this.flags.isEnabled("checkout_v2", { userId: cmd.buyerId });
    if (!enabled) throw new Error("checkout_v2_disabled");

    const run = async (): Promise<StartCheckoutV2Result> => {
      if (cmd.idempotencyKey) {
        const existing = await this.repo.findSessionByIdempotency(cmd.idempotencyKey);
        if (existing) {
          return {
            session: existing,
            sagaId: existing.sagaId,
            status: existing.status,
            clientSecret: null,
          };
        }
      }

      const cart = await this.getCart(cmd.cartId, cmd.buyerId);
      if (cart.status !== "open") throw new Error("cart_not_open");
      if (cart.items.length === 0) throw new Error("cart_empty");

      const session = await this.repo.createSession({
        cartId: cart.id,
        buyerId: cmd.buyerId,
        couponCode: cmd.couponCode?.toUpperCase() ?? null,
        idempotencyKey: cmd.idempotencyKey ?? null,
      });

      const correlationId = cmd.correlationId ?? cmd.requestId;
      const sagaResult = await runStartCheckoutSaga({
        pool: this.pool,
        repo: this.repo,
        payment: this.payment,
        correlationId,
        context: {
          requestId: cmd.requestId,
          sessionId: session.id,
          cartId: cart.id,
          buyerId: cmd.buyerId,
          couponCode: cmd.couponCode?.toUpperCase() ?? null,
          cartItems: cartItemsToSagaPayload(cart),
        },
      });

      if (sagaResult.status === "failed") {
        await this.repo.updateSession(session.id, {
          status: "failed",
          sagaId: sagaResult.sagaId,
          error: sagaResult.error ?? "saga_failed",
        });
        const failed = (await this.repo.findSession(session.id))!;
        return {
          session: failed,
          sagaId: sagaResult.sagaId,
          status: "failed",
          clientSecret: null,
          error: sagaResult.error,
        };
      }

      await this.repo.updateSession(session.id, {
        sagaId: sagaResult.sagaId,
        status: "payment_pending",
      });
      await this.repo.markCartCheckedOut(cart.id);

      const clientSecret =
        (sagaResult.context.paymentClientSecret as string | undefined) ?? null;
      const paymentIntentId =
        (sagaResult.context.paymentIntentId as string | undefined) ?? null;

      await this.tx.runInTransaction(async (txCtx) => {
        const started = domainEventFactory.create({
          eventType: "CheckoutStarted.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          payload: {
            cartId: cart.id,
            buyerId: cmd.buyerId,
            totalCents: Number(sagaResult.context.totalCents ?? 0),
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(started),
        });

        const orderCreated = domainEventFactory.create({
          eventType: "OrderCreated.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          causationId: started.eventId,
          payload: {
            buyerId: cmd.buyerId,
            checkoutSessionId: session.id,
            totalAmountCents: Number(sagaResult.context.totalCents ?? 0),
            paymentIntentId,
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(orderCreated),
        });
      });

      const finalSession = (await this.repo.findSession(session.id))!;
      log.info(
        {
          requestId: cmd.requestId,
          correlationId,
          sessionId: session.id,
          sagaId: sagaResult.sagaId,
        },
        "checkout_v2_started",
      );
      return {
        session: finalSession,
        sagaId: sagaResult.sagaId,
        status: "payment_pending",
        clientSecret,
      };
    };

    if (cmd.idempotencyKey) {
      return this.idempotent.handle(
        { name: "checkout.StartCheckout", execute: () => run() },
        undefined,
        cmd.idempotencyKey,
      );
    }
    return run();
  }

  async getSession(sessionId: string, buyerId: string): Promise<CheckoutSession> {
    const session = await this.repo.findSession(sessionId);
    if (!session) throw new Error("checkout_session_not_found");
    if (session.buyerId !== buyerId) throw new Error("checkout_buyer_mismatch");
    return session;
  }
}

export function createCheckoutService(
  pool: Pool,
  opts?: { flags?: FeatureFlagService | InMemoryFeatureFlagService },
): CheckoutService {
  return new CheckoutService(pool, opts);
}
