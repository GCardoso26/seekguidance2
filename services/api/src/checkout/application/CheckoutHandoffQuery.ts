import type { Pool } from "pg";
import { CheckoutRepository } from "../persistence/CheckoutRepository.js";

/** Public handoff DTO — Orders may call this; never SQL checkout.* from Orders. */
export interface CheckoutHandoffDTO {
  sessionId: string;
  buyerId: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentIntentId: string | null;
  paymentId: string | null;
  reservationIds: string[];
  items: Array<{
    listingId: string;
    productVariantId: string | null;
    catalogVariantId: string | null;
    sellerId: string | null;
    quantity: number;
    unitPriceCents: number;
    currency: string;
  }>;
}

export class CheckoutHandoffQuery {
  private readonly repo: CheckoutRepository;

  constructor(pool: Pool) {
    this.repo = new CheckoutRepository(pool);
  }

  async getCompletedHandoff(sessionId: string): Promise<CheckoutHandoffDTO | null> {
    const handoff = await this.repo.getHandoffWithPayment(sessionId);
    if (!handoff || handoff.status !== "completed") return null;
    return handoff;
  }
}

export function createCheckoutHandoffQuery(pool: Pool): CheckoutHandoffQuery {
  return new CheckoutHandoffQuery(pool);
}
