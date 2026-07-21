import type {
  ConfirmPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  PaymentIntentStatus,
  RefundPaymentInput,
  WebhookEvent,
} from "./PaymentGateway.js";

function formEncode(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function mapStripeStatus(status: string): PaymentIntentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "cancelled";
    case "requires_action":
    case "requires_payment_method":
    case "requires_confirmation":
      return "requires_action";
    case "processing":
      return "pending";
    default:
      return status === "failed" ? "failed" : "pending";
  }
}

/**
 * Stripe adapter (sandbox/live via STRIPE_SECRET_KEY).
 * Uses REST — Checkout never imports the Stripe SDK.
 */
export class StripePaymentGateway implements PaymentGateway {
  readonly provider = "stripe";

  constructor(
    private readonly secretKey = process.env.STRIPE_SECRET_KEY ?? "",
    private readonly webhookSecret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET ?? "",
  ) {
    if (!this.secretKey) {
      throw new Error("stripe_secret_key_missing");
    }
  }

  private async stripe(
    path: string,
    method: "GET" | "POST",
    body?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body ? formEncode(body) : undefined,
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = json.error as { message?: string } | undefined;
      throw new Error(`stripe_api_error:${err?.message ?? res.status}`);
    }
    return json;
  }

  private toResult(pi: Record<string, unknown>, method: "card" | "pix"): PaymentIntentResult {
    const nextAction = pi.next_action as
      | { pix_display_qr_code?: { data?: string; image_url_png?: string; expires_at?: number } }
      | undefined;
    const pixQr = nextAction?.pix_display_qr_code;
    return {
      externalId: String(pi.id),
      clientSecret: String(pi.client_secret ?? ""),
      amountCents: Number(pi.amount ?? 0),
      currency: String(pi.currency ?? "brl").toUpperCase(),
      provider: this.provider,
      status: mapStripeStatus(String(pi.status)),
      method,
      pix:
        method === "pix"
          ? {
              copyPaste: pixQr?.data ?? null,
              qrCodeBase64: pixQr?.image_url_png ?? null,
              expiresAt: pixQr?.expires_at
                ? new Date(pixQr.expires_at * 1000).toISOString()
                : null,
            }
          : null,
    };
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const method = input.method ?? "card";
    const body: Record<string, string> = {
      amount: String(input.amountCents),
      currency: input.currency.toLowerCase(),
      "metadata[sessionId]": input.sessionId,
      "metadata[buyerId]": input.buyerId ?? "",
    };
    if (method === "pix") {
      body["payment_method_types[0]"] = "pix";
    } else {
      // Do not combine payment_method_types with automatic_payment_methods (Stripe API rejects).
      body["payment_method_types[0]"] = "card";
    }
    const pi = await this.stripe("/payment_intents", "POST", body);
    return this.toResult(pi, method);
  }

  async getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null> {
    try {
      const pi = await this.stripe(`/payment_intents/${encodeURIComponent(externalId)}`, "GET");
      const types = (pi.payment_method_types as string[] | undefined) ?? [];
      const method = types.includes("pix") ? "pix" : "card";
      return this.toResult(pi, method);
    } catch {
      return null;
    }
  }

  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult> {
    if (input.simulateSuccess === true && process.env.CHECKOUT_ALLOW_SIMULATE === "1") {
      const current = await this.getPaymentIntent(input.externalId);
      if (!current) throw new Error("stripe_intent_not_found");
      return { ...current, status: "succeeded" };
    }
    const pi = await this.stripe(`/payment_intents/${encodeURIComponent(input.externalId)}`, "GET");
    const types = (pi.payment_method_types as string[] | undefined) ?? [];
    const method = types.includes("pix") ? "pix" : "card";
    return this.toResult(pi, method);
  }

  async refundPayment(input: RefundPaymentInput): Promise<{ ok: boolean; refundId?: string }> {
    const body: Record<string, string> = {
      payment_intent: input.externalId,
    };
    if (input.amountCents != null) body.amount = String(input.amountCents);
    if (input.reason) body.reason = "requested_by_customer";
    const refund = await this.stripe("/refunds", "POST", body);
    return { ok: true, refundId: String(refund.id) };
  }

  async parseWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): Promise<WebhookEvent | null> {
    // Signature verification: when secret set, require stripe-signature header presence
    // (full HMAC verify deferred to Stripe SDK in ops hardening — reject unsigned in prod).
    const sig = headers["stripe-signature"];
    if (this.webhookSecret && !sig) return null;

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
    const type = String(event.type ?? "");
    const data = event.data as { object?: Record<string, unknown> } | undefined;
    const obj = data?.object;
    if (!obj?.id) return null;

    let status: PaymentIntentStatus = "pending";
    if (type === "payment_intent.succeeded") status = "succeeded";
    else if (type === "payment_intent.payment_failed") status = "failed";
    else if (type === "payment_intent.canceled") status = "cancelled";
    else if (type.startsWith("payment_intent.")) status = mapStripeStatus(String(obj.status));
    else return null;

    return {
      provider: this.provider,
      eventId: String(event.id),
      externalIntentId: String(obj.id),
      status,
      raw: event,
    };
  }
}
