import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import type {
  ConfirmPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
  PaymentIntentStatus,
} from "./PaymentGateway.js";

/**
 * Stub gateway — in-memory intents for local/dev.
 * Real adapters (Stripe, MP, …) implement the same port.
 */
export class StubPaymentGateway implements PaymentGateway {
  readonly provider = "stub";
  private readonly intents = new Map<string, PaymentIntentResult>();

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const externalId = `pi_stub_${getIdGenerator().generate().replace(/-/g, "").slice(0, 24)}`;
    const result: PaymentIntentResult = {
      externalId,
      clientSecret: `${externalId}_secret_${input.sessionId.slice(0, 8)}`,
      amountCents: input.amountCents,
      currency: input.currency,
      provider: this.provider,
      status: "pending",
    };
    this.intents.set(externalId, result);
    return result;
  }

  async getPaymentIntent(externalId: string): Promise<PaymentIntentResult | null> {
    return this.intents.get(externalId) ?? null;
  }

  async confirmPaymentIntent(input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult> {
    let current = this.intents.get(input.externalId);
    if (!current) {
      // Intent may have been created in another process — synthesize succeeded for stub confirm
      current = {
        externalId: input.externalId,
        clientSecret: input.clientSecret ?? `${input.externalId}_secret`,
        amountCents: 0,
        currency: "BRL",
        provider: this.provider,
        status: "pending",
      };
    }
    if (current.status === "succeeded") return current;

    const status: PaymentIntentStatus =
      input.simulateSuccess === false ? "failed" : "succeeded";
    const next: PaymentIntentResult = { ...current, status };
    this.intents.set(input.externalId, next);
    return next;
  }
}
