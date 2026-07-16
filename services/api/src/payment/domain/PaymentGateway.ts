import type { PaymentIntent, PaymentProviderStatus, PaymentResult } from "./models.js";

/**
 * Port — PaymentGateway. Adapters: Fake (5.5) · Stripe (futuro).
 * Never receives Marketplace / Catalog IDs.
 */
export interface PaymentGateway {
  createPayment(intent: PaymentIntent): Promise<PaymentResult>;
  queryPayment(externalReference: string): Promise<PaymentProviderStatus>;
}

export type FakePaymentMode = "async" | "timeout";
