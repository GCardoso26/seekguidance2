import { createPaymentGateway } from "../src/checkout/application/payment/createPaymentGateway.js";
import { createShippingProvider } from "../src/checkout/application/shipping/createShippingProvider.js";

for (const g of ["stripe", "mercado_pago"] as const) {
  try {
    createPaymentGateway(g);
    console.log(`${g}: CONSTRUCTED`);
  } catch (e) {
    console.log(`${g}: BLOCKED ${(e as Error).message}`);
  }
}
try {
  createShippingProvider("melhor_envio");
  console.log("melhor_envio: CONSTRUCTED");
} catch (e) {
  console.log(`melhor_envio: BLOCKED ${(e as Error).message}`);
}
console.log(`CHECKOUT_PAYMENT_GATEWAY=${process.env.CHECKOUT_PAYMENT_GATEWAY ?? "stub(default)"}`);
console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING"}`);
console.log(`MERCADOPAGO_ACCESS_TOKEN=${process.env.MERCADOPAGO_ACCESS_TOKEN ? "SET" : "MISSING"}`);
console.log(`MELHOR_ENVIO_TOKEN=${process.env.MELHOR_ENVIO_TOKEN ? "SET" : "MISSING"}`);
