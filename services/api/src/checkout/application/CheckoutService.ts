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
import { CartAggregate } from "../domain/CartAggregate.js";
import type { PaymentGateway } from "./payment/PaymentGateway.js";
import { createPaymentGateway } from "./payment/createPaymentGateway.js";
import {
  createCheckoutValidationPipeline,
  type ValidationIssue,
} from "./CheckoutValidationPipeline.js";
import {
  cartItemsToSagaPayload,
  runStartCheckoutSaga,
} from "./CheckoutSaga.js";
import { runConfirmPaymentSaga } from "./ConfirmPaymentSaga.js";

const log = createLogger("checkout.service");

export interface AddToCartCommand {
  requestId: string;
  buyerId: string;
  cartId?: string;
  listingId: string;
  quantity: number;
}

export interface UpdateCartQuantityCommand {
  requestId: string;
  buyerId: string;
  cartId: string;
  listingId: string;
  quantity: number;
}

export interface MergeGuestCartCommand {
  requestId: string;
  buyerId: string;
  guestToken: string;
  targetCartId?: string;
}

export interface MergeUserCartCommand {
  requestId: string;
  buyerId: string;
  sourceCartId: string;
  targetCartId: string;
}

export interface StartCheckoutCommand {
  requestId: string;
  correlationId?: string;
  buyerId: string;
  cartId: string;
  couponCode?: string;
  idempotencyKey?: string;
  /** card (default) | pix */
  paymentMethod?: "card" | "pix";
}

export interface StartCheckoutV2Result {
  session: CheckoutSession;
  sagaId: string | null;
  status: string;
  clientSecret: string | null;
  pix?: {
    qrCodeBase64?: string | null;
    copyPaste?: string | null;
    expiresAt?: string | null;
  } | null;
  error?: string;
  validationIssues?: ValidationIssue[];
}

export interface ConfirmPaymentCommand {
  requestId: string;
  correlationId?: string;
  buyerId: string;
  sessionId: string;
  /** Default true for stub/dev; real gateways ignore or verify PSP. */
  simulateSuccess?: boolean;
  clientSecret?: string;
  idempotencyKey?: string;
}

export interface ConfirmPaymentResult {
  session: CheckoutSession;
  sagaId: string | null;
  status: string;
  confirmedReservationIds: string[];
  error?: string;
}

/**
 * Checkout BC V2 — Cart Aggregate + Coupon Rules + PaymentGateway + Validation pipeline + Saga.
 */
export class CheckoutService {
  private readonly repo: CheckoutRepository;
  private readonly payment: PaymentGateway;
  private readonly flags: FeatureFlagService | InMemoryFeatureFlagService;
  private readonly outbox: PostgresOutboxRepository;
  private readonly tx: PostgresTransactionManager;
  private readonly idempotent: IdempotentCommandHandler;
  private readonly validation = createCheckoutValidationPipeline();

  constructor(
    private readonly pool: Pool,
    opts?: {
      flags?: FeatureFlagService | InMemoryFeatureFlagService;
      payment?: PaymentGateway;
    },
  ) {
    this.repo = new CheckoutRepository(pool);
    this.flags = opts?.flags ?? createFeatureFlagService(pool);
    this.payment =
      opts?.payment ?? createPaymentGateway(process.env.CHECKOUT_PAYMENT_GATEWAY ?? "stub");
    this.outbox = new PostgresOutboxRepository(pool);
    this.tx = new PostgresTransactionManager(pool);
    this.idempotent = createIdempotentHandler(pool);
  }

  async getOrCreateCart(buyerId: string): Promise<Cart> {
    const existing = await this.repo.findOpenCartByBuyer(buyerId);
    if (existing) return existing;
    const agg = CartAggregate.create(buyerId);
    return this.repo.saveCartAggregate(agg);
  }

  async getOrCreateGuestCart(guestToken: string): Promise<Cart> {
    const existing = await this.repo.findOpenCartByGuestToken(guestToken);
    if (existing) return existing;
    const agg = CartAggregate.create(`guest:${guestToken}`, { guestToken });
    return this.repo.saveCartAggregate(agg);
  }

  async getCart(cartId: string, buyerId: string): Promise<Cart> {
    const cart = await this.repo.findCart(cartId);
    if (!cart) throw new Error("cart_not_found");
    if (cart.buyerId !== buyerId && !cart.buyerId.startsWith("guest:")) {
      throw new Error("cart_buyer_mismatch");
    }
    if (cart.buyerId !== buyerId && cart.buyerId.startsWith("guest:")) {
      throw new Error("cart_buyer_mismatch");
    }
    return cart;
  }

  private async loadAggregate(cartId: string): Promise<CartAggregate> {
    const cart = await this.repo.findCart(cartId);
    if (!cart) throw new Error("cart_not_found");
    return CartAggregate.rehydrate(cart, cart.guestToken ?? null);
  }

  async addToCart(cmd: AddToCartCommand): Promise<Cart> {
    const listings = createListingPublicQuery(this.pool);
    const listing = await listings.getListing(cmd.listingId);
    if (!listing) throw new Error("listing_not_found");
    if (listing.status !== "active") throw new Error("listing_not_active");
    if (cmd.quantity <= 0) throw new Error("quantity_invalid");
    if (listing.quantity < cmd.quantity) throw new Error("listing_insufficient_qty");

    let agg: CartAggregate;
    if (cmd.cartId) {
      await this.getCart(cmd.cartId, cmd.buyerId);
      agg = await this.loadAggregate(cmd.cartId);
    } else {
      const cart = await this.getOrCreateCart(cmd.buyerId);
      agg = CartAggregate.rehydrate(cart, cart.guestToken ?? null);
    }

    agg.addItem({
      listingId: listing.id,
      quantity: cmd.quantity,
      priceSnapshotCents: listing.priceCents,
      currency: listing.currency,
      productVariantId: listing.productVariantId,
      catalogVariantId: listing.catalogVariantId,
      sellerId: listing.sellerId,
      stockUnitId: listing.inventoryStockUnitId,
    });

    const saved = await this.repo.saveCartAggregate(agg);
    log.info(
      { requestId: cmd.requestId, cartId: saved.id, listingId: listing.id },
      "checkout_cart_item_added",
    );
    return saved;
  }

  async removeFromCart(buyerId: string, cartId: string, listingId: string): Promise<Cart> {
    await this.getCart(cartId, buyerId);
    const agg = await this.loadAggregate(cartId);
    agg.removeItem(listingId);
    return this.repo.saveCartAggregate(agg);
  }

  async updateQuantity(cmd: UpdateCartQuantityCommand): Promise<Cart> {
    await this.getCart(cmd.cartId, cmd.buyerId);
    const agg = await this.loadAggregate(cmd.cartId);
    agg.updateQuantity(cmd.listingId, cmd.quantity);
    return this.repo.saveCartAggregate(agg);
  }

  async mergeGuestCart(cmd: MergeGuestCartCommand): Promise<Cart> {
    const guestCart = await this.repo.findOpenCartByGuestToken(cmd.guestToken);
    if (!guestCart) throw new Error("guest_cart_not_found");

    const target =
      cmd.targetCartId != null
        ? await this.getCart(cmd.targetCartId, cmd.buyerId)
        : await this.getOrCreateCart(cmd.buyerId);

    const userAgg = CartAggregate.rehydrate(target, target.guestToken ?? null);
    const guestAgg = CartAggregate.rehydrate(guestCart, guestCart.guestToken ?? null);
    userAgg.mergeGuestCart(guestAgg);
    const saved = await this.repo.saveCartAggregate(userAgg);
    await this.repo.markCartAbandoned(guestCart.id, saved.id);
    log.info(
      { requestId: cmd.requestId, guestCartId: guestCart.id, userCartId: saved.id },
      "checkout_merge_guest_cart",
    );
    return saved;
  }

  async mergeUserCart(cmd: MergeUserCartCommand): Promise<Cart> {
    await this.getCart(cmd.sourceCartId, cmd.buyerId);
    await this.getCart(cmd.targetCartId, cmd.buyerId);
    const target = await this.loadAggregate(cmd.targetCartId);
    const source = await this.loadAggregate(cmd.sourceCartId);
    target.mergeUserCart(source);
    const saved = await this.repo.saveCartAggregate(target);
    await this.repo.markCartAbandoned(cmd.sourceCartId, saved.id);
    log.info(
      {
        requestId: cmd.requestId,
        sourceCartId: cmd.sourceCartId,
        targetCartId: saved.id,
      },
      "checkout_merge_user_cart",
    );
    return saved;
  }

  async validateItems(buyerId: string, cartId: string) {
    await this.getCart(cartId, buyerId);
    const agg = await this.loadAggregate(cartId);
    const listings = createListingPublicQuery(this.pool);
    const map = new Map<
      string,
      { listingId: string; status: string; quantityAvailable: number; priceCents: number; active: boolean }
    >();
    for (const item of agg.items) {
      const listing = await listings.getListing(item.listingId);
      if (listing) {
        map.set(item.listingId, {
          listingId: listing.id,
          status: listing.status,
          quantityAvailable: listing.quantity,
          priceCents: listing.priceCents,
          active: listing.status === "active",
        });
      }
    }
    return agg.validateItems(map);
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
      const agg = CartAggregate.rehydrate(cart, cart.guestToken ?? null);
      agg.assertOpen();
      if (agg.items.length === 0) throw new Error("cart_empty");

      const listingsApi = createListingPublicQuery(this.pool);
      const listings = new Map(
        await Promise.all(
          [...agg.items].map(async (i) => {
            const l = await listingsApi.getListing(i.listingId);
            return [i.listingId, l] as const;
          }),
        ),
      );
      const listingMap = new Map(
        [...listings].filter(([, v]) => v != null).map(([k, v]) => [k, v!]),
      );

      const coupon = cmd.couponCode
        ? await this.repo.getCouponDefinition(cmd.couponCode)
        : null;

      const validation = await this.validation.run({
        cart: agg,
        listings: listingMap,
        coupon,
        paymentReady: true,
      });
      if (!validation.ok) {
        return {
          session: {
            id: "",
            cartId: cart.id,
            buyerId: cmd.buyerId,
            status: "failed",
            couponCode: cmd.couponCode ?? null,
            subtotalCents: 0,
            discountCents: 0,
            totalCents: 0,
            currency: "BRL",
            sagaId: null,
            paymentIntentId: null,
            reservationIds: [],
            pricingSnapshot: {},
            idempotencyKey: cmd.idempotencyKey ?? null,
            error: validation.issues[0]?.code ?? "validation_failed",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          sagaId: null,
          status: "failed",
          clientSecret: null,
          error: validation.issues[0]?.code ?? "validation_failed",
          validationIssues: validation.issues,
        };
      }

      // CreateSession after validation pipeline
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
          paymentMethod: cmd.paymentMethod === "pix" ? "pix" : "card",
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
      agg.markCheckedOut();
      await this.repo.saveCartAggregate(agg);

      const clientSecret =
        (sagaResult.context.paymentClientSecret as string | undefined) ?? null;

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
      });

      const finalSession = (await this.repo.findSession(session.id))!;
      const paymentPix =
        (sagaResult.context.paymentPix as StartCheckoutV2Result["pix"]) ?? null;
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
        pix: paymentPix,
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

  /**
   * Confirm payment → InventoryConfirm → CheckoutCompleted + OrderCreated (Outbox).
   */
  async confirmPayment(cmd: ConfirmPaymentCommand): Promise<ConfirmPaymentResult> {
    const enabled = await this.flags.isEnabled("checkout_v2", { userId: cmd.buyerId });
    if (!enabled) throw new Error("checkout_v2_disabled");

    const run = async (): Promise<ConfirmPaymentResult> => {
      const session = await this.getSession(cmd.sessionId, cmd.buyerId);
      if (session.status === "completed") {
        return {
          session,
          sagaId: session.sagaId,
          status: "completed",
          confirmedReservationIds: session.reservationIds,
        };
      }
      if (!session.paymentIntentId) throw new Error("payment_intent_missing");

      const correlationId = cmd.correlationId ?? cmd.requestId;
      const sagaResult = await runConfirmPaymentSaga({
        pool: this.pool,
        repo: this.repo,
        payment: this.payment,
        correlationId,
        context: {
          requestId: cmd.requestId,
          sessionId: session.id,
          buyerId: cmd.buyerId,
          paymentIntentId: session.paymentIntentId,
          reservationIds: session.reservationIds,
          simulateSuccess: cmd.simulateSuccess,
          clientSecret: cmd.clientSecret,
        },
      });

      if (sagaResult.status === "failed") {
        const failed = (await this.repo.findSession(session.id))!;
        return {
          session: failed,
          sagaId: sagaResult.sagaId,
          status: "failed",
          confirmedReservationIds: [],
          error: sagaResult.error,
        };
      }

      const finalSession = (await this.repo.findSession(session.id))!;
      const confirmedIds =
        (sagaResult.context.confirmedReservationIds as string[] | undefined) ??
        finalSession.reservationIds;

      await this.tx.runInTransaction(async (txCtx) => {
        const paymentApproved = domainEventFactory.create({
          eventType: "PaymentApproved.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          payload: {
            paymentIntentId: session.paymentIntentId,
            sessionId: session.id,
            amountCents: finalSession.totalCents,
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(paymentApproved),
        });

        const inventoryConfirmed = domainEventFactory.create({
          eventType: "InventoryConfirmed.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          causationId: paymentApproved.eventId,
          payload: {
            sessionId: session.id,
            reservationIds: confirmedIds,
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(inventoryConfirmed),
        });

        const orderCreated = domainEventFactory.create({
          eventType: "OrderCreated.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          causationId: paymentApproved.eventId,
          payload: {
            buyerId: cmd.buyerId,
            checkoutSessionId: session.id,
            totalAmountCents: finalSession.totalCents,
            paymentIntentId: session.paymentIntentId,
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(orderCreated),
        });

        const completed = domainEventFactory.create({
          eventType: "CheckoutCompleted.v1",
          aggregateId: session.id,
          aggregateType: "checkout_session",
          correlationId,
          causationId: orderCreated.eventId,
          payload: {
            buyerId: cmd.buyerId,
            sessionId: session.id,
            totalCents: finalSession.totalCents,
          },
        });
        await this.outbox.insert(txCtx, {
          event: domainEventFactory.toLegacy(completed),
        });
      });

      log.info(
        {
          requestId: cmd.requestId,
          correlationId,
          sessionId: session.id,
          sagaId: sagaResult.sagaId,
        },
        "checkout_v2_payment_confirmed",
      );

      return {
        session: finalSession,
        sagaId: sagaResult.sagaId,
        status: "completed",
        confirmedReservationIds: confirmedIds,
      };
    };

    if (cmd.idempotencyKey) {
      return this.idempotent.handle(
        { name: "checkout.ConfirmPayment", execute: () => run() },
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

  /**
   * Expire payment_pending session: release holds + CheckoutExpired.v1 via Outbox.
   */
  async expireSession(sessionId: string, requestId?: string): Promise<CheckoutSession> {
    const session = await this.repo.findSession(sessionId);
    if (!session) throw new Error("checkout_session_not_found");
    if (session.status === "completed" || session.status === "expired") {
      return session;
    }
    if (session.status !== "payment_pending" && session.status !== "failed") {
      throw new Error(`checkout_session_not_expirable:${session.status}`);
    }

    const { createInventoryService } = await import("../../inventory/public.js");
    const inventory = createInventoryService(this.pool);
    const rid = requestId ?? `expire:${sessionId}`;
    for (const id of [...session.reservationIds].reverse()) {
      try {
        await inventory.release(id, rid);
      } catch (e) {
        log.warn(
          { reservationId: id, err: e instanceof Error ? e.message : String(e) },
          "expire_release_failed",
        );
      }
    }

    try {
      await this.repo.updateSession(sessionId, {
        status: "expired",
        error: "checkout_expired",
      });
    } catch {
      await this.repo.updateSession(sessionId, {
        status: "cancelled",
        error: "checkout_expired",
      });
    }

    const correlationId = rid;
    await this.tx.runInTransaction(async (txCtx) => {
      const expired = domainEventFactory.create({
        eventType: "CheckoutExpired.v1",
        aggregateId: sessionId,
        aggregateType: "checkout_session",
        correlationId,
        payload: {
          sessionId,
          buyerId: session.buyerId,
          paymentIntentId: session.paymentIntentId,
        },
      });
      await this.outbox.insert(txCtx, {
        event: domainEventFactory.toLegacy(expired),
      });
    });

    return (await this.repo.findSession(sessionId))!;
  }

  /**
   * Provider webhook → ConfirmPayment (idempotent by session completed + payment unique).
   */
  async handlePaymentWebhook(input: {
    headers: Record<string, string | string[] | undefined>;
    rawBody: string;
    requestId?: string;
  }): Promise<{ ok: boolean; sessionId?: string; status?: string; error?: string }> {
    if (!this.payment.parseWebhook) {
      return { ok: false, error: "webhook_not_supported" };
    }
    const event = await this.payment.parseWebhook(input.headers, input.rawBody);
    if (!event) return { ok: false, error: "webhook_parse_failed" };
    if (event.status !== "succeeded") {
      return { ok: true, status: event.status };
    }

    const intent = await this.repo.findPaymentIntentByExternalId(event.externalIntentId);
    if (!intent) return { ok: false, error: "payment_intent_not_found" };
    const session = await this.repo.findSession(intent.sessionId);
    if (!session) return { ok: false, error: "checkout_session_not_found" };

    const result = await this.confirmPayment({
      requestId: input.requestId ?? `wh:${event.eventId}`,
      buyerId: session.buyerId,
      sessionId: session.id,
      simulateSuccess: false,
      idempotencyKey: `webhook:${event.provider}:${event.eventId}`,
    });

    return {
      ok: result.status === "completed" || result.status === "failed",
      sessionId: session.id,
      status: result.status,
      error: result.error,
    };
  }
}

export function createCheckoutService(
  pool: Pool,
  opts?: {
    flags?: FeatureFlagService | InMemoryFeatureFlagService;
    payment?: PaymentGateway;
  },
): CheckoutService {
  return new CheckoutService(pool, opts);
}
