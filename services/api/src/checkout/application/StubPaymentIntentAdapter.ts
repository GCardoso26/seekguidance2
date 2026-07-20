import { getIdGenerator } from "../../shared/ids/IdGenerator.js";

export interface PaymentIntentResult {
  externalId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
}

/**
 * Stub Payment Intent adapter (V1).
 * Stripe integration exists in the monorepo — do not reinvent; swap adapter later.
 */
export class StubPaymentIntentAdapter {
  async create(input: {
    amountCents: number;
    currency: string;
    sessionId: string;
  }): Promise<PaymentIntentResult> {
    const externalId = `pi_stub_${getIdGenerator().generate().replace(/-/g, "").slice(0, 24)}`;
    return {
      externalId,
      clientSecret: `${externalId}_secret_${input.sessionId.slice(0, 8)}`,
      amountCents: input.amountCents,
      currency: input.currency,
    };
  }
}
