/**
 * Payment Gateway Port — Adapter Pattern.
 * Checkout never imports Stripe/MP/PagSeguro/etc. directly.
 */
export interface CreatePaymentIntentInput {
  amountCents: number;
  currency: string;
  sessionId: string;
  buyerId?: string;
  metadata?: Record<string, string>;
  /** card | pix — default card-compatible intent. */
  method?: "card" | "pix";
  /** Absolute ISO expiry for PIX (gateway may clamp). */
  expiresAt?: string;
}

export type PaymentIntentStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "cancelled"
  | "failed";

export interface PixDetails {
  qrCodeBase64?: string | null;
  copyPaste?: string | null;
  expiresAt?: string | null;
}

export interface PaymentIntentResult {
  externalId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  provider: string;
  status: PaymentIntentStatus;
  method?: "card" | "pix" | "unknown";
  pix?: PixDetails | null;
}

export interface ConfirmPaymentIntentInput {
  externalId: string;
  /** Stub/dev: force success without PSP round-trip. */
  simulateSuccess?: boolean;
  clientSecret?: string;
}

export interface RefundPaymentInput {
  externalId: string;
  amountCents?: number;
  reason?: string;
}

export interface WebhookEvent {
  provider: string;
  /** Provider-unique event id for idempotency. */
  eventId: string;
  externalIntentId: string;
  status: PaymentIntentStatus;
  raw?: unknown;
}

export interface PaymentGateway {
  readonly provider: string;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null>;
  confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult>;
  /** Optional — used when InventoryConfirm fails after capture. */
  refundPayment?(input: RefundPaymentInput): Promise<{ ok: boolean; refundId?: string }>;
  /** Optional — parse provider webhook into normalized event. */
  parseWebhook?(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): Promise<WebhookEvent | null>;
}

export type PaymentGatewayName =
  | "stub"
  | "stripe"
  | "mercado_pago"
  | "pagseguro"
  | "pagarme"
  | "asaas";
