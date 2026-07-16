import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import type { Payment } from "../../payment/domain/models.js";
import type { CheckoutSessionRepository } from "../domain/CheckoutSessionRepository.js";
import type { OrderRepository } from "../domain/OrderRepository.js";
import type { Order } from "../domain/models.js";
import type { ConfirmReservationApplicationService } from "../reservation/application/ConfirmReservationApplicationService.js";
import type { ReleaseReservationApplicationService } from "../reservation/application/ReleaseReservationApplicationService.js";
import { domainMetrics } from "../../observability/metrics/domainMetrics.js";

export interface SettlePaymentInput {
  requestId: string;
  payment: Payment;
  outcome: "authorized" | "failed" | "cancelled";
}

export interface SettlePaymentResult {
  order: Order;
}

/**
 * Completes Order after Payment webhook — Confirm/Release reservations.
 * Does not call PaymentGateway.
 */
export class SettlePaymentApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly orders: OrderRepository,
    private readonly checkouts: CheckoutSessionRepository,
    private readonly confirmReservation: ConfirmReservationApplicationService,
    private readonly releaseReservation: ReleaseReservationApplicationService,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: SettlePaymentInput): Promise<SettlePaymentResult> {
    const order = await this.tx.runInTransaction((t) =>
      this.orders.findById(t, input.payment.orderId),
    );
    if (!order) throw new Error("order_not_found");

    // Idempotent settlement — already finalized.
    if (order.status === "PAID" || order.status === "CANCELLED") {
      return { order };
    }
    if (order.status !== "PENDING") throw new Error("order_not_pending");

    if (input.outcome === "authorized") {
      for (const id of input.payment.reservationIds) {
        await this.confirmReservation.execute({
          requestId: `${input.requestId}:confirm:${id}`,
          reservationId: id,
        });
      }
      return this.tx.runInTransaction(async (txCtx) => {
        const paid = await this.orders.updateStatus(txCtx, order.id, "PAID");
        await this.checkouts.updateStatus(txCtx, order.checkoutSessionId, "COMPLETED");
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "OrderCompleted",
            paid.id,
            { status: paid.status, totalAmountCents: paid.totalAmountCents },
            {
              requestId: input.requestId,
              aggregateType: "order",
              producer: "SettlePaymentApplicationService",
            },
          ),
        });
        domainMetrics.checkoutCompleted(0);
        return { order: paid };
      });
    }

    for (const id of input.payment.reservationIds) {
      try {
        await this.releaseReservation.execute({
          requestId: `${input.requestId}:release:${id}`,
          reservationId: id,
        });
        domainMetrics.reservationRelease();
      } catch {
        // Already released / confirmed — ignore for settlement idempotency.
      }
    }

    return this.tx.runInTransaction(async (txCtx) => {
      await this.checkouts.updateStatus(txCtx, order.checkoutSessionId, "FAILED");
      const cancelled = await this.orders.updateStatus(txCtx, order.id, "CANCELLED");
      domainMetrics.checkoutFailed();
      return { order: cancelled };
    });
  }
}
