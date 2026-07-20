import type { Pool } from "pg";
import {
  createCheckoutHandoffQuery,
  type CheckoutHandoffDTO,
} from "../../checkout/public.js";
import { domainEventFactory } from "../../platform/events/DomainEventFactory.js";
import { PostgresOutboxRepository } from "../../platform/outbox/PostgresOutboxRepository.js";
import { PostgresTransactionManager } from "../../platform/transaction/PostgresTransactionManager.js";
import { createLogger } from "../../platform/logging/logger.js";
import { OrderAggregate } from "../domain/OrderAggregate.js";
import type { Order } from "../domain/types.js";
import { OrdersRepository } from "../persistence/OrdersRepository.js";

const log = createLogger("orders.service");

export interface CreateOrderFromCheckoutResult {
  order: Order;
  created: boolean;
}

/**
 * Orders BC — create from Checkout handoff (public API only).
 */
export class OrdersService {
  private readonly repo: OrdersRepository;
  private readonly outbox: PostgresOutboxRepository;
  private readonly tx: PostgresTransactionManager;

  constructor(private readonly pool: Pool) {
    this.repo = new OrdersRepository(pool);
    this.outbox = new PostgresOutboxRepository(pool);
    this.tx = new PostgresTransactionManager(pool);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.repo.findById(orderId);
  }

  async createFromCheckoutSession(
    sessionId: string,
    opts?: { requestId?: string; correlationId?: string },
  ): Promise<CreateOrderFromCheckoutResult> {
    const existing = await this.repo.findByCheckoutSession(sessionId);
    if (existing) return { order: existing, created: false };

    const handoff = await createCheckoutHandoffQuery(this.pool).getCompletedHandoff(sessionId);
    if (!handoff) throw new Error("checkout_handoff_unavailable");

    return this.createFromHandoff(handoff, opts);
  }

  async createFromHandoff(
    handoff: CheckoutHandoffDTO,
    opts?: { requestId?: string; correlationId?: string },
  ): Promise<CreateOrderFromCheckoutResult> {
    const existing = await this.repo.findByCheckoutSession(handoff.sessionId);
    if (existing) return { order: existing, created: false };

    const sellerId =
      handoff.items.map((i) => i.sellerId).find((s) => Boolean(s)) ?? null;

    const agg = OrderAggregate.create({
      buyerId: handoff.buyerId,
      sellerId,
      checkoutSessionId: handoff.sessionId,
      checkoutPaymentId: handoff.paymentId,
      currency: handoff.currency,
      subtotalCents: handoff.subtotalCents,
      discountCents: handoff.discountCents,
      totalCents: handoff.totalCents,
      alreadyPaid: Boolean(handoff.paymentId) || handoff.status === "completed",
      items: handoff.items.map((i) => ({
        listingId: i.listingId,
        productVariantId: i.productVariantId,
        catalogVariantId: i.catalogVariantId,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        currency: i.currency,
      })),
    });

    const order = await this.repo.saveAggregate(agg);
    const correlationId = opts?.correlationId ?? opts?.requestId ?? order.id;

    await this.tx.runInTransaction(async (txCtx) => {
      const created = domainEventFactory.create({
        eventType: "OrderCreated.v1",
        aggregateId: order.id,
        aggregateType: "order",
        correlationId,
        payload: {
          buyerId: order.buyerId,
          checkoutSessionId: order.checkoutSessionId,
          totalAmountCents: order.totalCents,
          sellerId: order.sellerId,
        },
      });
      await this.outbox.insert(txCtx, { event: domainEventFactory.toLegacy(created) });

      if (order.status === "PAID") {
        const paid = domainEventFactory.create({
          eventType: "OrderPaid.v1",
          aggregateId: order.id,
          aggregateType: "order",
          correlationId,
          causationId: created.eventId,
          payload: {
            buyerId: order.buyerId,
            totalAmountCents: order.totalCents,
            paymentId: order.checkoutPaymentId,
          },
        });
        await this.outbox.insert(txCtx, { event: domainEventFactory.toLegacy(paid) });
      }
    });

    log.info(
      { orderId: order.id, sessionId: handoff.sessionId, status: order.status },
      "order_created_from_checkout",
    );
    return { order, created: true };
  }
}

export function createOrdersService(pool: Pool): OrdersService {
  return new OrdersService(pool);
}
