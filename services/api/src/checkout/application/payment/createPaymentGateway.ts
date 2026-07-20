import type { PaymentGateway, PaymentGatewayName } from "./PaymentGateway.js";
import { StubPaymentGateway } from "./StubPaymentGateway.js";

/**
 * Resolve gateway by name. Concrete SDKs live in adapter modules — never in CheckoutService.
 */
export function createPaymentGateway(name: PaymentGatewayName | string = "stub"): PaymentGateway {
  switch (name) {
    case "stub":
      return new StubPaymentGateway();
    case "stripe":
    case "mercado_pago":
    case "pagseguro":
    case "pagarme":
    case "asaas":
      // Adapters to be wired when credentials exist — fail closed to stub in non-prod is OK via env.
      throw new Error(`payment_gateway_not_wired:${name}`);
    default:
      throw new Error(`payment_gateway_unknown:${name}`);
  }
}
