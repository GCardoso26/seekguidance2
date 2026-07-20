/**
 * PaymentIntent = "quero pagar" (autorização / captura pendente no gateway).
 * Payment = "o gateway confirmou" (fato financeiro).
 *
 * Mantém Checkout capaz de PIX / cartão / boleto / reprocessamento / chargeback
 * sem misturar intent com captura.
 */

export type PaymentMethod = "unknown" | "card" | "pix" | "boleto" | "wallet" | "other";

export type PaymentStatus =
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "chargeback";

export interface PaymentIntentRecord {
  id: string;
  sessionId: string;
  externalId: string;
  provider: string;
  amountCents: number;
  currency: string;
  status: string;
  clientSecret: string | null;
}

export interface PaymentRecord {
  id: string;
  sessionId: string;
  paymentIntentId: string | null;
  externalIntentId: string;
  provider: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  capturedAt: Date;
}

export interface RecordPaymentInput {
  sessionId: string;
  paymentIntentInternalId?: string | null;
  externalIntentId: string;
  provider: string;
  amountCents: number;
  currency: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  providerPayload?: Record<string, unknown>;
}
