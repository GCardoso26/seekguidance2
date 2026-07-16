import type { TxContext } from "../../platform/transaction/types.js";
import type { Payment, PaymentProviderName, PaymentStatus } from "./models.js";

export interface CreatePaymentInput {
  id?: string;
  orderId: string;
  amountCents: number;
  currency?: "BRL";
  provider?: PaymentProviderName;
  requestId: string;
  reservationIds?: string[];
}

export interface PaymentRepository {
  create(tx: TxContext, input: CreatePaymentInput): Promise<Payment>;
  findById(tx: TxContext, id: string): Promise<Payment | null>;
  findByRequestId(tx: TxContext, requestId: string): Promise<Payment | null>;
  findByOrderId(tx: TxContext, orderId: string): Promise<Payment | null>;
  updateStatus(
    tx: TxContext,
    id: string,
    status: PaymentStatus,
    opts?: {
      externalReference?: string | null;
      expectedVersion?: number;
    },
  ): Promise<Payment>;
  /** Returns true if event_key was newly recorded; false if duplicate. */
  recordEventIfNew(
    tx: TxContext,
    input: {
      paymentId: string;
      eventKey: string;
      eventType: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<boolean>;
}
