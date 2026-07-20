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
}

export type PaymentIntentStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "cancelled"
  | "failed";

export interface PaymentIntentResult {
  externalId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  provider: string;
  status: PaymentIntentStatus;
}

export interface ConfirmPaymentIntentInput {
  externalId: string;
  /** Stub/dev: force success without PSP round-trip. */
  simulateSuccess?: boolean;
  clientSecret?: string;
}

export interface PaymentGateway {
  readonly provider: string;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null>;
  confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult>;
}

export type PaymentGatewayName =
  | "stub"
  | "stripe"
  | "mercado_pago"
  | "pagseguro"
  | "pagarme"
  | "asaas";
