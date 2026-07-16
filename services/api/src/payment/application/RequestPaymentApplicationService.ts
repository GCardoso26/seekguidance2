import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import type { PaymentGateway } from "../domain/PaymentGateway.js";
import type { PaymentRepository } from "../domain/PaymentRepository.js";
import type { Payment } from "../domain/models.js";
import { domainMetrics } from "../../observability/metrics/domainMetrics.js";

export interface RequestPaymentInput {
  requestId: string;
  orderId: string;
  amountCents: number;
  currency?: "BRL";
  reservationIds: string[];
}

export interface RequestPaymentResult {
  payment: Payment;
  /** True when same requestId already created the payment. */
  idempotent: boolean;
  /** Provider returned TIMEOUT — leave checkout pending, do not fail. */
  providerTimeout: boolean;
}

/**
 * Creates Payment + calls PaymentGateway.createPayment.
 * Does not complete the Order — webhook / settlement does.
 */
export class RequestPaymentApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly payments: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: RequestPaymentInput): Promise<RequestPaymentResult> {
    const existing = await this.tx.runInTransaction((t) =>
      this.payments.findByRequestId(t, input.requestId),
    );
    if (existing) {
      return {
        payment: existing,
        idempotent: true,
        providerTimeout: false,
      };
    }

    if (input.amountCents <= 0) throw new Error("payment_amount_invalid");

    const created = await this.tx.runInTransaction(async (txCtx) => {
      const payment = await this.payments.create(txCtx, {
        orderId: input.orderId,
        amountCents: input.amountCents,
        currency: input.currency ?? "BRL",
        requestId: input.requestId,
        reservationIds: input.reservationIds,
        provider: "fake",
      });
      return payment;
    });

    const result = await this.gateway.createPayment({
      paymentId: created.id,
      orderId: input.orderId,
      amountCents: input.amountCents,
      currency: input.currency ?? "BRL",
      requestId: input.requestId,
    });

    const providerTimeout = result.status === "TIMEOUT";

    const updated = await this.tx.runInTransaction(async (txCtx) => {
      const payment = await this.payments.updateStatus(txCtx, created.id, "REQUESTED", {
        externalReference: result.externalReference,
        expectedVersion: created.rowVersion,
      });
      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "PaymentRequested",
          payment.id,
          {
            orderId: payment.orderId,
            amountCents: payment.amountCents,
            externalReference: payment.externalReference,
            providerStatus: result.status,
          },
          {
            requestId: input.requestId,
            aggregateType: "payment",
            producer: "RequestPaymentApplicationService",
          },
        ),
      });
      return payment;
    });

    domainMetrics.paymentRequested();
    domainMetrics.paymentPending(1);
    return { payment: updated, idempotent: false, providerTimeout };
  }
}
