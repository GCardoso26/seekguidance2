/**
 * CLI — Search performance report (Sprint 3.1).
 * Usage: MEILI_HOST=... SEARCH_CATALOG_CARD_COUNT=295 npx tsx src/workers/search-report.ts
 */
import { createLogger } from "../platform/logging/logger.js";
import { InMemorySearchProjectionRepository } from "../search/persistence/InMemorySearchProjectionRepository.js";
import { createSearchProjectionFromEnv } from "../search/persistence/MeilisearchSearchProjectionRepository.js";
import { buildSearchPerformanceReport } from "../search/report/SearchPerformanceReport.js";
import { ProjectionManager } from "../search/ProjectionManager.js";

const log = createLogger("cli.search-report");

async function main(): Promise<void> {
  const projection = createSearchProjectionFromEnv() ?? new InMemorySearchProjectionRepository();
  if (!process.env.MEILI_HOST) {
    log.info("MEILI_HOST unset — reporting against in-memory projection");
  } else {
    await projection.ensureIndex();
  }

  const mgr = new ProjectionManager(projection);
  const report = await buildSearchPerformanceReport(projection);
  const catalogHint = Number(process.env.SEARCH_CATALOG_CARD_COUNT ?? "0");
  const coverage = catalogHint > 0 ? await mgr.coverage(catalogHint) : null;
  const drift = await mgr.drift();

  console.log(
    JSON.stringify(
      {
        ...report,
        alias: mgr.getLiveAlias(),
        coverage,
        drift,
        leadTime: mgr.leadTimeStats(),
      },
      null,
      2,
    ),
  );

  if (report.health.status === "down") process.exit(2);
  if (report.p95Ms != null && report.p95Ms >= 100 && report.documentCount > 0) {
    log.warn({ p95Ms: report.p95Ms }, "search_p95_over_budget");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
