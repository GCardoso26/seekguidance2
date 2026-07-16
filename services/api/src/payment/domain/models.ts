/** Payment bounded context models (Sprint 5.5). Never references Marketplace. */

export type PaymentStatus =
  | "CREATED"
  | "REQUESTED"
  | "AUTHORIZED"
  | "FAILED"
  | "CANCELLED";

export type PaymentProviderName = "fake" | "stripe";

export interface Payment {
  id: string;
  orderId: string;
  amountCents: number;
  currency: "BRL";
  status: PaymentStatus;
  provider: PaymentProviderName;
  externalReference: string | null;
  /** Idempotency key for create/request. */
  requestId: string;
  /** Reservation IDs held for this payment (Order settlement). */
  reservationIds: string[];
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Intent sent to PaymentGateway — no Listing/Seller/Inventory. */
export interface PaymentIntent {
  paymentId: string;
  orderId: string;
  amountCents: number;
  currency: "BRL";
  requestId: string;
}

export type PaymentProviderStatus =
  | "REQUESTED"
  | "AUTHORIZED"
  | "FAILED"
  | "TIMEOUT";

export interface PaymentResult {
  externalReference: string;
  status: PaymentProviderStatus;
}

export type PaymentWebhookEvent =
  | "payment.approved"
  | "payment.declined"
  | "payment.failed"
  | "payment.cancelled";
