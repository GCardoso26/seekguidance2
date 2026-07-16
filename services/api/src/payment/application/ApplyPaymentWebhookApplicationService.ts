import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import {
  isTerminalPaymentStatus,
} from "../domain/PaymentPolicy.js";
import type { PaymentRepository } from "../domain/PaymentRepository.js";
import type { Payment, PaymentStatus, PaymentWebhookEvent } from "../domain/models.js";
import { verifyFakePaymentSignature } from "../infrastructure/fake/FakePaymentProvider.js";
import { domainMetrics } from "../../observability/metrics/domainMetrics.js";

export interface ApplyPaymentWebhookInput {
  requestId: string;
  provider: string;
  event: PaymentWebhookEvent | string;
  paymentId: string;
  idempotencyKey?: string;
  signature?: string;
}

export interface ApplyPaymentWebhookResult {
  payment: Payment;
  /** Duplicate webhook — no domain change. */
  duplicate: boolean;
  /** Transition applied (or already terminal with same outcome). */
  outcome: "authorized" | "failed" | "cancelled" | "ignored";
}

const EVENT_TO_STATUS: Record<string, PaymentStatus> = {
  "payment.approved": "AUTHORIZED",
  "payment.declined": "FAILED",
  "payment.failed": "FAILED",
  "payment.cancelled": "CANCELLED",
};

/**
 * Validates and applies provider webhook to Payment aggregate only.
 * Order settlement is a separate AS (order BC).
 */
export class ApplyPaymentWebhookApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly payments: PaymentRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  execute(input: ApplyPaymentWebhookInput): Promise<ApplyPaymentWebhookResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      if (input.provider !== "fake") {
        throw new Error("payment_provider_unknown");
      }
      const targetStatus = EVENT_TO_STATUS[input.event];
      if (!targetStatus) {
        throw new Error("payment_event_invalid");
      }
      if (!verifyFakePaymentSignature(input.paymentId, input.signature)) {
        throw new Error("payment_signature_invalid");
      }

      const payment = await this.payments.findById(txCtx, input.paymentId);
      if (!payment) throw new Error("payment_not_found");

      const eventKey =
        input.idempotencyKey ??
        `${input.provider}:${input.event}:${input.paymentId}`;

      const isNew = await this.payments.recordEventIfNew(txCtx, {
        paymentId: payment.id,
        eventKey,
        eventType: input.event,
        payload: { provider: input.provider },
      });

      if (!isNew) {
        domainMetrics.paymentWebhookDuplicate();
        return {
          payment,
          duplicate: true,
          outcome: mapOutcome(payment.status),
        };
      }

      if (isTerminalPaymentStatus(payment.status)) {
        // Out-of-order / conflicting webhook after terminal — keep consistent state.
        return {
          payment,
          duplicate: false,
          outcome: "ignored",
        };
      }

      if (payment.status !== "REQUESTED" && payment.status !== "CREATED") {
        return { payment, duplicate: false, outcome: "ignored" };
      }

      const updated = await this.payments.updateStatus(txCtx, payment.id, targetStatus, {
        expectedVersion: payment.rowVersion,
      });

      const eventName =
        targetStatus === "AUTHORIZED"
          ? "PaymentApproved"
          : targetStatus === "CANCELLED"
            ? "PaymentCancelled"
            : "PaymentDeclined";

      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          eventName,
          updated.id,
          {
            orderId: updated.orderId,
            amountCents: updated.amountCents,
            status: updated.status,
          },
          {
            requestId: input.requestId,
            aggregateType: "payment",
            producer: "ApplyPaymentWebhookApplicationService",
          },
        ),
      });

      if (targetStatus === "FAILED") {
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "PaymentFailed",
            updated.id,
            { orderId: updated.orderId, status: updated.status },
            {
              requestId: input.requestId,
              aggregateType: "payment",
              producer: "ApplyPaymentWebhookApplicationService",
            },
          ),
        });
        domainMetrics.paymentFailed();
      }
      if (targetStatus === "AUTHORIZED") {
        domainMetrics.paymentAuthorized();
        domainMetrics.paymentPending(0);
      }

      return {
        payment: updated,
        duplicate: false,
        outcome: mapOutcome(updated.status),
      };
    });
  }
}

function mapOutcome(
  status: PaymentStatus,
): ApplyPaymentWebhookResult["outcome"] {
  if (status === "AUTHORIZED") return "authorized";
  if (status === "CANCELLED") return "cancelled";
  if (status === "FAILED") return "failed";
  return "ignored";
}
