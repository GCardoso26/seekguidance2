import { Pool } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { ExpansionAssetSyncService } from "../application/ExpansionAssetSyncService.js";
import { createAssetHealthService } from "../application/AssetHealthService.js";
import { createKnowledgeCoverageService } from "../application/KnowledgeCoverageService.js";
import { listExpansionAssetProviders } from "../providers/registry.js";
import { createProviderScheduler } from "../scheduler/ProviderScheduler.js";

/**
 * Incremental scheduler tick — BullMQ enqueue only.
 * Flags: --bootstrap, --expansion, --health, --knowledge
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  const scheduler = createProviderScheduler(pool);

  if (process.argv.includes("--bootstrap")) {
    await scheduler.syncFromMemoryRegistry();
    console.log(
      "schedules bootstrapped: accessories/manufacturers daily; publishers/sealed hourly",
    );
  }

  const result = await scheduler.tick();

  let expansion: { ingested: number; errors: string[] } | undefined;
  if (process.argv.includes("--expansion") || process.env.PRODUCT_CATALOG_SYNC_EXPANSION === "1") {
    const svc = new ExpansionAssetSyncService(pool);
    expansion = await svc.runProviders(listExpansionAssetProviders(), getIdGenerator().generate());
  }

  let health: { overall: number } | undefined;
  if (process.argv.includes("--health") || process.env.PRODUCT_CATALOG_ASSET_HEALTH_REFRESH === "1") {
    const report = await createAssetHealthService(pool).computeReport();
    health = { overall: report.overall };
  }

  let knowledge: { overallPct: number } | undefined;
  if (
    process.argv.includes("--knowledge") ||
    process.env.PRODUCT_CATALOG_KNOWLEDGE_COVERAGE_REFRESH === "1"
  ) {
    const report = await createKnowledgeCoverageService(pool).computeReport();
    knowledge = { overallPct: report.overallPct };
  }

  console.log(
    JSON.stringify({
      ...result,
      expansion,
      health,
      knowledge,
      jobs: [
        "daily accessories",
        "daily manufacturers",
        "hourly publishers",
        "expansion detect",
        "asset refresh",
        "relationship refresh",
        "asset health refresh",
        "knowledge coverage",
        "official contents sync",
        "specifications sync",
        "collections sync",
        "lifecycle sync",
        "metadata sync",
        "marketing assets / PDFs / decklists",
      ],
    }),
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
