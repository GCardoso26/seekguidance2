import type { TxContext } from "../../platform/transaction/types.js";
import type { CheckoutSession, CheckoutStatus } from "./models.js";

export interface CreateCheckoutInput {
  id?: string;
  cartId: string;
  buyerId: string;
}

export interface CheckoutSessionRepository {
  create(tx: TxContext, input: CreateCheckoutInput): Promise<CheckoutSession>;
  findById(tx: TxContext, id: string): Promise<CheckoutSession | null>;
  updateStatus(
    tx: TxContext,
    id: string,
    status: CheckoutStatus,
    opts?: { orderId?: string; expectedVersion?: number },
  ): Promise<CheckoutSession>;
}
