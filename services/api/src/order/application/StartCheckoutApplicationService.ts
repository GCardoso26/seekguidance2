import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import type { CartRepository } from "../domain/CartRepository.js";
import type { CheckoutSessionRepository } from "../domain/CheckoutSessionRepository.js";
import type { OrderRepository } from "../domain/OrderRepository.js";
import { cartTotalCents, type CheckoutSession, type Order } from "../domain/models.js";
import { domainMetrics } from "../../observability/metrics/domainMetrics.js";

export interface StartCheckoutInput {
  requestId: string;
  cartId: string;
  buyerId: string;
}

export interface StartCheckoutResult {
  session: CheckoutSession;
  order: Order;
}

/**
 * Start checkout — freezes cart prices into Order items (snapshots).
 * Leaves CheckoutSession at CREATED (pay = Hold → Payment — Sprint 5.4).
 * Does NOT call Payment yet (Sprint 5.5 Stripe).
 */
export class StartCheckoutApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly carts: CartRepository,
    private readonly checkouts: CheckoutSessionRepository,
    private readonly orders: OrderRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: StartCheckoutInput): Promise<StartCheckoutResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      const cart = await this.carts.findById(txCtx, input.cartId);
      if (!cart) throw new Error("cart_not_found");
      if (cart.buyerId !== input.buyerId) throw new Error("cart_buyer_mismatch");
      if (cart.status !== "open") throw new Error("cart_not_open");
      if (cart.items.length === 0) throw new Error("cart_empty");

      const session = await this.checkouts.create(txCtx, {
        cartId: cart.id,
        buyerId: input.buyerId,
      });

      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "CheckoutStarted",
          session.id,
          { cartId: cart.id, buyerId: input.buyerId },
          {
            requestId: input.requestId,
            aggregateType: "checkout_session",
            producer: "StartCheckoutApplicationService",
          },
        ),
      });

      // Snapshot prices from cart items — never re-read Listing.
      const order = await this.orders.create(txCtx, {
        buyerId: input.buyerId,
        checkoutSessionId: session.id,
        items: cart.items.map((i) => ({
          listingId: i.listingId,
          catalogVariantId: i.catalogVariantId,
          quantity: i.quantity,
          unitPriceCents: i.priceSnapshotCents,
          currency: i.currency,
        })),
      });

      if (order.totalAmountCents !== cartTotalCents(cart)) {
        throw new Error("order_total_mismatch");
      }

      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "OrderCreated",
          order.id,
          {
            buyerId: order.buyerId,
            checkoutSessionId: session.id,
            totalAmountCents: order.totalAmountCents,
            currency: order.currency,
            itemCount: order.items.length,
          },
          {
            requestId: input.requestId,
            aggregateType: "order",
            producer: "StartCheckoutApplicationService",
          },
        ),
      });

      await this.checkouts.updateStatus(txCtx, session.id, "CREATED", {
        orderId: order.id,
      });
      await this.carts.markCheckedOut(txCtx, cart.id);

      domainMetrics.checkoutStarted();
      const updatedSession = await this.checkouts.findById(txCtx, session.id);
      return { session: updatedSession!, order };
    });
  }
}
