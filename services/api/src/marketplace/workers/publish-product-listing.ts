import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { createMarketplaceOrchestrator } from "../application/MarketplaceOrchestrator.js";

async function main() {
  const sellerId = process.argv[2];
  const variantId = process.argv[3];
  const priceCents = Number(process.argv[4] ?? "1000");
  const stock = Number(process.argv[5] ?? "1");
  if (!sellerId || !variantId) {
    console.error(
      "Usage: publish-product-listing.ts <sellerId> <productVariantId> [priceCents] [stock]",
    );
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  const orch = createMarketplaceOrchestrator(pool);
  const result = await orch.publishProductListing({
    requestId: randomUUID(),
    sellerId,
    productVariantId: variantId,
    priceCents,
    stock,
    condition: "NEW",
  });
  console.log(JSON.stringify(result, null, 2));
  await pool.end();
  if (result.status === "failed") process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
