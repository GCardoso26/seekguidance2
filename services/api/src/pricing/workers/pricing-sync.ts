import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { createPricingService } from "../PricingService.js";
import type { PricingSubjectType } from "../domain/types.js";

async function main() {
  const subjectType = (process.argv[2] ?? "product_variant") as PricingSubjectType;
  const subjectId = process.argv[3];
  if (!subjectId) {
    console.error("Usage: pricing-sync.ts <subject_type> <subject_id>");
    process.exit(1);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  const service = createPricingService(pool);
  const valuation = await service.syncSubject({
    requestId: randomUUID(),
    subjectType,
    subjectId,
  });
  console.log(JSON.stringify(valuation, null, 2));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
