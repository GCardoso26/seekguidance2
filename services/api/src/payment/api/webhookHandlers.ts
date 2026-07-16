import type { IncomingMessage, ServerResponse } from "node:http";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { readJsonBody, sendJson, str } from "../../identity/http/httpHelpers.js";
import type { ApplyPaymentWebhookApplicationService } from "../application/ApplyPaymentWebhookApplicationService.js";
import type { SettlePaymentApplicationService } from "../../order/application/SettlePaymentApplicationService.js";
import type { PaymentWebhookEvent } from "../domain/models.js";

export interface PaymentWebhookHttpDeps {
  applyWebhook: ApplyPaymentWebhookApplicationService;
  settlePayment: SettlePaymentApplicationService;
}

/**
 * POST /api/v1/payments/webhook — Fake provider simulation (Sprint 5.5).
 * Never trusts the client: validates provider, event, signature, idempotency.
 */
export async function handlePaymentWebhookApi(
  deps: PaymentWebhookHttpDeps,
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
): Promise<boolean> {
  if (path !== "/api/v1/payments/webhook" || method !== "POST") {
    return false;
  }

  const body = await readJsonBody(req);
  const provider = str(body, "provider");
  const event = str(body, "event");
  const paymentId = str(body, "paymentId");
  const idempotencyKey = str(body, "idempotencyKey");
  const signature =
    (typeof req.headers["x-payment-signature"] === "string"
      ? req.headers["x-payment-signature"]
      : undefined) ?? str(body, "signature");

  if (!provider || !event || !paymentId) {
    sendJson(res, 400, { error: "webhook_payload_invalid" });
    return true;
  }

  const requestId = getIdGenerator().generate();
  const applied = await deps.applyWebhook.execute({
    requestId,
    provider,
    event: event as PaymentWebhookEvent,
    paymentId,
    idempotencyKey: idempotencyKey ?? undefined,
    signature,
  });

  let orderStatus: string | null = null;
  if (
    !applied.duplicate &&
    (applied.outcome === "authorized" ||
      applied.outcome === "failed" ||
      applied.outcome === "cancelled")
  ) {
    const settled = await deps.settlePayment.execute({
      requestId: `${requestId}:settle`,
      payment: applied.payment,
      outcome: applied.outcome,
    });
    orderStatus = settled.order.status;
  } else if (applied.duplicate || applied.outcome === "ignored") {
    // Still settle idempotently if payment already terminal but order not yet.
    if (
      applied.payment.status === "AUTHORIZED" ||
      applied.payment.status === "FAILED" ||
      applied.payment.status === "CANCELLED"
    ) {
      const outcome =
        applied.payment.status === "AUTHORIZED"
          ? "authorized"
          : applied.payment.status === "CANCELLED"
            ? "cancelled"
            : "failed";
      const settled = await deps.settlePayment.execute({
        requestId: `${requestId}:settle`,
        payment: applied.payment,
        outcome,
      });
      orderStatus = settled.order.status;
    }
  }

  sendJson(res, 200, {
    paymentId: applied.payment.id,
    paymentStatus: applied.payment.status,
    duplicate: applied.duplicate,
    outcome: applied.outcome,
    orderStatus,
  });
  return true;
}

export function mapPaymentWebhookError(
  message: string,
): { status: number; error: string } | null {
  const map: Record<string, { status: number; error: string }> = {
    payment_provider_unknown: { status: 400, error: "payment_provider_unknown" },
    payment_event_invalid: { status: 400, error: "payment_event_invalid" },
    payment_signature_invalid: { status: 401, error: "payment_signature_invalid" },
    payment_not_found: { status: 404, error: "payment_not_found" },
  };
  return map[message] ?? null;
}
