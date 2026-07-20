import type { PaymentGateway, PaymentGatewayName } from "./PaymentGateway.js";
import { StubPaymentGateway } from "./StubPaymentGateway.js";
import { StripePaymentGateway } from "./StripePaymentGateway.js";
import { MercadoPagoPaymentGateway } from "./MercadoPagoPaymentGateway.js";
import { SkeletonPaymentGateway } from "./SkeletonPaymentGateway.js";

/**
 * Resolve gateway by name. Concrete SDKs/HTTP live in adapter modules — never in CheckoutService.
 */
export function createPaymentGateway(name: PaymentGatewayName | string = "stub"): PaymentGateway {
  switch (name) {
    case "stub":
      return new StubPaymentGateway();
    case "stripe":
      return new StripePaymentGateway();
    case "mercado_pago":
      return new MercadoPagoPaymentGateway();
    case "pagseguro":
    case "pagarme":
    case "asaas":
      return new SkeletonPaymentGateway(name);
    default:
      throw new Error(`payment_gateway_unknown:${name}`);
  }
}
