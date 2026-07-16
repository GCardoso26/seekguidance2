/**
 * Checkout API worker (Sprint 5.4) — Identity + Marketplace + Order HTTP.
 * Usage: npm run api:checkout
 */
import { createInMemoryCheckoutApiStack } from "../order/createInMemoryCheckoutApiStack.js";

async function main(): Promise<void> {
  const port = Number(process.env.CHECKOUT_API_PORT ?? process.env.AUTH_API_PORT ?? "8790");
  const stack = createInMemoryCheckoutApiStack({
    jwtSecret: process.env.JWT_SECRET ?? "dev-checkout-jwt-secret!!",
  });
  const { port: bound } = await stack.listen(port);
  console.log(`Checkout API listening on http://127.0.0.1:${bound}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
