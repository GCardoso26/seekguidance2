import { getClock } from "../../../shared/time/Clock.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import type {
  FakePaymentMode,
  PaymentGateway,
} from "../../domain/PaymentGateway.js";
import type {
  PaymentIntent,
  PaymentProviderStatus,
  PaymentResult,
} from "../../domain/models.js";

/**
 * Fake PaymentGateway — async by default (webhook completes payment).
 * Mode `timeout`: createPayment returns TIMEOUT without authorizing.
 */
export class FakePaymentProvider implements PaymentGateway {
  private refs = new Map<string, PaymentProviderStatus>();

  constructor(private mode: FakePaymentMode = "async") {}

  setMode(mode: FakePaymentMode): void {
    this.mode = mode;
  }

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    if (intent.amountCents <= 0) throw new Error("payment_amount_invalid");
    const externalReference = `fake_${intent.paymentId.slice(0, 8)}_${getIdGenerator().generate().slice(0, 6)}`;
    const status: PaymentProviderStatus =
      this.mode === "timeout" ? "TIMEOUT" : "REQUESTED";
    this.refs.set(externalReference, status);
    void getClock().now();
    return { externalReference, status };
  }

  async queryPayment(externalReference: string): Promise<PaymentProviderStatus> {
    const status = this.refs.get(externalReference);
    if (!status) throw new Error("payment_not_found_at_provider");
    return status;
  }

  /** Simulator helper — mark provider-side status (optional). */
  mark(externalReference: string, status: PaymentProviderStatus): void {
    this.refs.set(externalReference, status);
  }
}

/** Fake webhook signature: `fake:<paymentId>`. */
export function fakePaymentSignature(paymentId: string): string {
  return `fake:${paymentId}`;
}

export function verifyFakePaymentSignature(
  paymentId: string,
  signature: string | undefined,
): boolean {
  return signature === fakePaymentSignature(paymentId);
}
