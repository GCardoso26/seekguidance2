import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import type {
  ConfirmPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  PaymentIntentStatus,
  RefundPaymentInput,
  WebhookEvent,
} from "./PaymentGateway.js";

/**
 * Stub gateway — in-memory intents for local/dev + PIX QR simulation.
 */
export class StubPaymentGateway implements PaymentGateway {
  readonly provider = "stub";
  private readonly intents = new Map<string, PaymentIntentResult>();
  private readonly webhookSeen = new Set<string>();

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const externalId = `pi_stub_${getIdGenerator().generate().replace(/-/g, "").slice(0, 24)}`;
    const method = input.method ?? "card";
    const expiresAt =
      input.expiresAt ??
      (method === "pix"
        ? new Date(Date.now() + 15 * 60_000).toISOString()
        : undefined);
    const result: PaymentIntentResult = {
      externalId,
      clientSecret: `${externalId}_secret_${input.sessionId.slice(0, 8)}`,
      amountCents: input.amountCents,
      currency: input.currency,
      provider: this.provider,
      status: method === "pix" ? "requires_action" : "pending",
      method,
      pix:
        method === "pix"
          ? {
              qrCodeBase64: Buffer.from(`stub-pix-qr:${externalId}`).toString("base64"),
              copyPaste: `00020126580014br.gov.bcb.pix0136${externalId}520400005303986540${(input.amountCents / 100).toFixed(2)}5802BR5925JudgeTCG Stub PIX6009SAO PAULO62070503***6304ABCD`,
              expiresAt: expiresAt ?? null,
            }
          : null,
    };
    this.intents.set(externalId, result);
    return result;
  }

  async getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null> {
    return this.intents.get(externalId) ?? null;
  }

  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult> {
    let current = this.intents.get(input.externalId);
    if (!current) {
      current = {
        externalId: input.externalId,
        clientSecret: input.clientSecret ?? `${input.externalId}_secret`,
        amountCents: 0,
        currency: "BRL",
        provider: this.provider,
        status: "pending",
        method: "unknown",
      };
    }
    if (current.status === "succeeded") return current;

    const status: PaymentIntentStatus =
      input.simulateSuccess === false ? "failed" : "succeeded";
    const next: PaymentIntentResult = { ...current, status };
    this.intents.set(input.externalId, next);
    return next;
  }

  async refundPayment(input: RefundPaymentInput): Promise<{ ok: boolean; refundId?: string }> {
    const current = this.intents.get(input.externalId);
    if (current) {
      this.intents.set(input.externalId, { ...current, status: "cancelled" });
    }
    return { ok: true, refundId: `re_stub_${input.externalId.slice(-8)}` };
  }

  async parseWebhook(
    _headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): Promise<WebhookEvent | null> {
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
    const eventId = String(body.eventId ?? body.id ?? "");
    const externalIntentId = String(body.externalIntentId ?? body.payment_intent ?? "");
    if (!eventId || !externalIntentId) return null;
    if (this.webhookSeen.has(eventId)) {
      return {
        provider: this.provider,
        eventId,
        externalIntentId,
        status: "succeeded",
        raw: body,
      };
    }
    this.webhookSeen.add(eventId);
    const status = (body.status as PaymentIntentStatus) ?? "succeeded";
    const current = this.intents.get(externalIntentId);
    if (current) {
      this.intents.set(externalIntentId, { ...current, status });
    }
    return {
      provider: this.provider,
      eventId,
      externalIntentId,
      status,
      raw: body,
    };
  }
}
