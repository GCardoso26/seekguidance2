import type {
  ConfirmPaymentIntentInput,
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentGatewayName,
  PaymentIntentResult,
  RefundPaymentInput,
  WebhookEvent,
} from "./PaymentGateway.js";

/**
 * Skeleton adapters — port-compliant, fail closed until credentials + PSP wiring.
 * Used for Asaas / PagSeguro / Pagar.me in this sprint (1B).
 */
export class SkeletonPaymentGateway implements PaymentGateway {
  constructor(readonly provider: Exclude<PaymentGatewayName, "stub" | "stripe" | "mercado_pago">) {}

  async createPaymentIntent(_input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    throw new Error(`payment_gateway_skeleton:${this.provider}`);
  }

  async getPaymentIntent(_externalId: string): Promise<PaymentIntentResult | null> {
    throw new Error(`payment_gateway_skeleton:${this.provider}`);
  }

  async confirmPaymentIntent(_input: ConfirmPaymentIntentInput): Promise<PaymentIntentResult> {
    throw new Error(`payment_gateway_skeleton:${this.provider}`);
  }

  async refundPayment(_input: RefundPaymentInput): Promise<{ ok: boolean; refundId?: string }> {
    throw new Error(`payment_gateway_skeleton:${this.provider}`);
  }

  async parseWebhook(
    _headers: Record<string, string | string[] | undefined>,
    _rawBody: string,
  ): Promise<WebhookEvent | null> {
    throw new Error(`payment_gateway_skeleton:${this.provider}`);
  }
}
