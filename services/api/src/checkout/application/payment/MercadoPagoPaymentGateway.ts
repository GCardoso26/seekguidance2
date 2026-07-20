import type {
  ConfirmPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  PaymentIntentStatus,
  RefundPaymentInput,
  WebhookEvent,
} from "./PaymentGateway.js";

function mapMpStatus(status: string): PaymentIntentStatus {
  switch (status) {
    case "approved":
      return "succeeded";
    case "rejected":
    case "cancelled":
      return "cancelled";
    case "pending":
    case "in_process":
      return "requires_action";
    default:
      return "pending";
  }
}

/**
 * Mercado Pago adapter (sandbox/live via MERCADOPAGO_ACCESS_TOKEN).
 * PIX via payment_method_id=pix.
 */
export class MercadoPagoPaymentGateway implements PaymentGateway {
  readonly provider = "mercado_pago";

  constructor(
    private readonly accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    private readonly webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
  ) {
    if (!this.accessToken) {
      throw new Error("mercadopago_access_token_missing");
    }
  }

  private async mp(
    path: string,
    method: "GET" | "POST",
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.mercadopago.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(`mercadopago_api_error:${JSON.stringify(json).slice(0, 200)}`);
    }
    return json;
  }

  private toResult(payment: Record<string, unknown>, method: "card" | "pix"): PaymentIntentResult {
    const poi = payment.point_of_interaction as
      | { transaction_data?: { qr_code?: string; qr_code_base64?: string } }
      | undefined;
    const tx = poi?.transaction_data;
    const dateOfExpiration = payment.date_of_expiration
      ? String(payment.date_of_expiration)
      : null;
    return {
      externalId: String(payment.id),
      clientSecret: String(payment.id),
      amountCents: Math.round(Number(payment.transaction_amount ?? 0) * 100),
      currency: String(payment.currency_id ?? "BRL"),
      provider: this.provider,
      status: mapMpStatus(String(payment.status)),
      method,
      pix:
        method === "pix"
          ? {
              copyPaste: tx?.qr_code ?? null,
              qrCodeBase64: tx?.qr_code_base64 ?? null,
              expiresAt: dateOfExpiration,
            }
          : null,
    };
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const method = input.method ?? "pix";
    if (method === "pix") {
      const payment = await this.mp("/v1/payments", "POST", {
        transaction_amount: input.amountCents / 100,
        description: `JudgeTCG checkout ${input.sessionId}`,
        payment_method_id: "pix",
        payer: {
          email: input.metadata?.email ?? "buyer@judgetcg.local",
        },
        external_reference: input.sessionId,
        metadata: {
          sessionId: input.sessionId,
          buyerId: input.buyerId ?? "",
        },
        date_of_expiration: input.expiresAt,
      });
      return this.toResult(payment, "pix");
    }

    // Card: create preference / pending payment placeholder — confirm via webhook
    const payment = await this.mp("/v1/payments", "POST", {
      transaction_amount: input.amountCents / 100,
      description: `JudgeTCG checkout ${input.sessionId}`,
      payment_method_id: "visa",
      capture: false,
      payer: {
        email: input.metadata?.email ?? "buyer@judgetcg.local",
      },
      external_reference: input.sessionId,
      metadata: {
        sessionId: input.sessionId,
        buyerId: input.buyerId ?? "",
      },
    });
    return this.toResult(payment, "card");
  }

  async getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null> {
    try {
      const payment = await this.mp(`/v1/payments/${encodeURIComponent(externalId)}`, "GET");
      const method = String(payment.payment_method_id) === "pix" ? "pix" : "card";
      return this.toResult(payment, method);
    } catch {
      return null;
    }
  }

  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult> {
    if (input.simulateSuccess === true && process.env.CHECKOUT_ALLOW_SIMULATE === "1") {
      const current = await this.getPaymentIntent(input.externalId);
      if (!current) throw new Error("mercadopago_intent_not_found");
      return { ...current, status: "succeeded" };
    }
    const current = await this.getPaymentIntent(input.externalId);
    if (!current) throw new Error("mercadopago_intent_not_found");
    return current;
  }

  async refundPayment(input: RefundPaymentInput): Promise<{ ok: boolean; refundId?: string }> {
    const body: Record<string, unknown> = {};
    if (input.amountCents != null) body.amount = input.amountCents / 100;
    const refund = await this.mp(
      `/v1/payments/${encodeURIComponent(input.externalId)}/refunds`,
      "POST",
      body,
    );
    return { ok: true, refundId: String(refund.id ?? "") };
  }

  async parseWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): Promise<WebhookEvent | null> {
    if (this.webhookSecret) {
      const secret = headers["x-signature"] ?? headers["x-hub-signature"];
      if (!secret) return null;
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
    const data = body.data as { id?: string } | undefined;
    const paymentId = String(data?.id ?? body.id ?? "");
    if (!paymentId) return null;
    const payment = await this.getPaymentIntent(paymentId);
    if (!payment) return null;
    return {
      provider: this.provider,
      eventId: String(body.id ?? body.action ?? `${paymentId}:${payment.status}`),
      externalIntentId: paymentId,
      status: payment.status,
      raw: body,
    };
  }
}
