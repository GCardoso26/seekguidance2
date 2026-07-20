import type { Pool } from "pg";
import { createInventoryService } from "../../inventory/public.js";
import {
  createSagaOrchestrator,
  type SagaDefinition,
} from "../../platform/saga/SagaOrchestrator.js";
import { createLogger } from "../../platform/logging/logger.js";
import type { CheckoutRepository } from "../persistence/CheckoutRepository.js";
import type { PaymentGateway } from "./payment/PaymentGateway.js";

const log = createLogger("checkout.confirm-saga");

export interface ConfirmPaymentSagaContext extends Record<string, unknown> {
  requestId: string;
  sessionId: string;
  buyerId: string;
  paymentIntentId: string;
  simulateSuccess?: boolean;
  clientSecret?: string;
  reservationIds: string[];
  paymentStatus?: string;
  paymentId?: string;
  confirmedReservationIds?: string[];
}

/**
 * ConfirmPayment saga:
 * ValidateSession → ConfirmGatewayPayment → InventoryConfirm → MarkSessionCompleted
 *
 * Falha no gateway → release holds (compensate path via explicit release step on fail).
 */
export function buildConfirmPaymentSagaDefinition(deps: {
  pool: Pool;
  repo: CheckoutRepository;
  payment: PaymentGateway;
  maxAttempts?: number;
}): SagaDefinition<ConfirmPaymentSagaContext> {
  const inventory = createInventoryService(deps.pool);
  const maxAttempts = deps.maxAttempts ?? 3;

  return {
    sagaType: "ConfirmPayment",
    steps: [
      {
        name: "ValidateSession",
        maxAttempts: 1,
        execute: async (ctx) => {
          const session = await deps.repo.findSession(ctx.sessionId);
          if (!session) throw new Error("checkout_session_not_found");
          if (session.buyerId !== ctx.buyerId) throw new Error("checkout_buyer_mismatch");
          if (session.status === "completed") {
            return {
              alreadyCompleted: true,
              reservationIds: session.reservationIds,
              paymentIntentId: session.paymentIntentId ?? ctx.paymentIntentId,
            };
          }
          if (session.status !== "payment_pending") {
            throw new Error(`checkout_session_not_payable:${session.status}`);
          }
          if (!session.paymentIntentId) throw new Error("payment_intent_missing");
          const reservationIds = session.reservationIds;
          if (!reservationIds.length) throw new Error("reservations_missing");
          return {
            paymentIntentId: session.paymentIntentId,
            reservationIds,
            alreadyCompleted: false,
          };
        },
      },
      {
        name: "ConfirmGatewayPayment",
        maxAttempts,
        execute: async (ctx) => {
          if (ctx.alreadyCompleted) return { paymentStatus: "succeeded" };
          const result = await deps.payment.confirmPaymentIntent({
            externalId: String(ctx.paymentIntentId),
            simulateSuccess: ctx.simulateSuccess,
            clientSecret: ctx.clientSecret,
          });
          await deps.repo.updatePaymentIntentStatus(String(ctx.paymentIntentId), result.status);
          if (result.status !== "succeeded") {
            // Payment declined — release holds before failing the saga
            for (const id of [...ctx.reservationIds].reverse()) {
              try {
                await inventory.release(id, ctx.requestId);
              } catch (e) {
                log.error(
                  { reservationId: id, err: e instanceof Error ? e.message : String(e) },
                  "payment_fail_release_failed",
                );
              }
            }
            await deps.repo.updateSession(ctx.sessionId, {
              status: "failed",
              error: `payment_${result.status}`,
            });
            throw new Error(`payment_not_succeeded:${result.status}`);
          }

          // Intent succeeded → persist Payment (confirmed fact), distinct from Intent
          const intentRow = await deps.repo.findPaymentIntentByExternalId(
            String(ctx.paymentIntentId),
          );
          const session = await deps.repo.findSession(ctx.sessionId);
          const payment = await deps.repo.recordPayment({
            sessionId: ctx.sessionId,
            paymentIntentInternalId: intentRow?.id ?? null,
            externalIntentId: String(ctx.paymentIntentId),
            provider: result.provider,
            amountCents: result.amountCents || session?.totalCents || intentRow?.amountCents || 0,
            currency: result.currency || session?.currency || "BRL",
            method: "unknown",
            status: "captured",
            providerPayload: { gatewayStatus: result.status },
          });
          return { paymentStatus: result.status, paymentId: payment.id };
        },
      },
      {
        name: "InventoryConfirm",
        maxAttempts: 1,
        execute: async (ctx) => {
          if (ctx.alreadyCompleted) {
            return { confirmedReservationIds: ctx.reservationIds };
          }
          const confirmed: string[] = [];
          for (const reservationId of ctx.reservationIds) {
            await inventory.confirm(reservationId);
            confirmed.push(reservationId);
          }
          return { confirmedReservationIds: confirmed };
        },
      },
      {
        name: "MarkSessionCompleted",
        maxAttempts: 1,
        execute: async (ctx) => {
          if (ctx.alreadyCompleted) return {};
          await deps.repo.markSessionCompleted(ctx.sessionId);
          const session = await deps.repo.findSession(ctx.sessionId);
          if (session?.couponCode) {
            await deps.repo.incrementCouponUse(session.couponCode);
          }
          return {};
        },
      },
    ],
  };
}

export async function runConfirmPaymentSaga(deps: {
  pool: Pool;
  repo: CheckoutRepository;
  payment: PaymentGateway;
  context: ConfirmPaymentSagaContext;
  correlationId: string;
  maxAttempts?: number;
}): Promise<{
  sagaId: string;
  status: string;
  context: ConfirmPaymentSagaContext;
  error?: string;
}> {
  const saga = createSagaOrchestrator(deps.pool);
  const definition = buildConfirmPaymentSagaDefinition({
    pool: deps.pool,
    repo: deps.repo,
    payment: deps.payment,
    maxAttempts: deps.maxAttempts,
  });
  const result = await saga.run(definition, deps.context, {
    correlationId: deps.correlationId,
    requestId: deps.context.requestId,
  });
  return {
    sagaId: result.sagaId,
    status: result.status,
    context: result.context as ConfirmPaymentSagaContext,
    error: result.error,
  };
}
