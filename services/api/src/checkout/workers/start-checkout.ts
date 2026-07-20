/**
 * CLI — start Checkout V2 for an existing cart (requires DATABASE_URL + checkout_v2 ON).
 * Usage: npm run checkout:start -- <buyerId> <cartId> [couponCode]
 */
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { createCheckoutService } from "../application/CheckoutService.js";
import { InMemoryFeatureFlagService } from "../../platform/feature-flags/FeatureFlagService.js";

async function main() {
  const buyerId = process.argv[2];
  const cartId = process.argv[3];
  const couponCode = process.argv[4];
  if (!buyerId || !cartId) {
    console.error("Usage: checkout:start <buyerId> <cartId> [couponCode]");
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  const force = process.env.CHECKOUT_V2_FORCE === "1";
  const pool = new Pool({ connectionString: databaseUrl });
  const checkout = createCheckoutService(pool, {
    flags: force
      ? new InMemoryFeatureFlagService({ checkout_v2: true })
      : undefined,
  });

  const result = await checkout.startCheckout({
    requestId: randomUUID(),
    buyerId,
    cartId,
    couponCode,
    idempotencyKey: process.env.IDEMPOTENCY_KEY,
  });
  console.log(JSON.stringify(result, null, 2));
  await pool.end();
  if (result.status === "failed") process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
