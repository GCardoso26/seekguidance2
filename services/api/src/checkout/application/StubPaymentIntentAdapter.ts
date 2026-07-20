import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { CreatePaymentIntentInput, PaymentIntentResult } from "./payment/PaymentGateway.js";
import { StubPaymentGateway } from "./payment/StubPaymentGateway.js";

/**
 * @deprecated Use PaymentGateway / StubPaymentGateway — kept for brief compatibility.
 */
export class StubPaymentIntentAdapter {
  private readonly gateway = new StubPaymentGateway();

  async create(input: {
    amountCents: number;
    currency: string;
    sessionId: string;
  }): Promise<PaymentIntentResult> {
    return this.gateway.createPaymentIntent({
      ...input,
      metadata: { migratedFrom: "StubPaymentIntentAdapter" },
    } satisfies CreatePaymentIntentInput);
  }
}

export function createStubPaymentIntentId(): string {
  return `pi_stub_${getIdGenerator().generate().replace(/-/g, "").slice(0, 24)}`;
}
