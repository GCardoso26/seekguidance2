/**
 * Public Read API process — Sprint 3.5.
 * GET /api/v1/* → SearchQueryService → Projection (never Catalog).
 */
import { createLogger } from "../platform/logging/logger.js";
import { InMemorySearchProjectionRepository } from "../search/persistence/InMemorySearchProjectionRepository.js";
import { createSearchProjectionFromEnv } from "../search/persistence/MeilisearchSearchProjectionRepository.js";
import { ProjectionSearchQueryService } from "../search/application/ProjectionSearchQueryService.js";
import { listenPublicReadApi } from "../public-api/http/createPublicReadServer.js";

const log = createLogger("public-api");

async function main(): Promise<void> {
  const projection = createSearchProjectionFromEnv() ?? new InMemorySearchProjectionRepository();
  await projection.ensureIndex();
  const queries = new ProjectionSearchQueryService(projection);
  const { port } = await listenPublicReadApi({ queries, projection });
  log.info(
    {
      port,
      projection: projection.getVersion().name,
      routes: [
        "GET /api/v1/search",
        "GET /api/v1/suggest",
        "GET /api/v1/cards",
        "GET /api/v1/cards/:id",
        "GET /api/v1/sets",
        "GET /api/v1/sets/:code",
        "GET /api/v1/variants",
        "GET /api/v1/variants/:id",
      ],
    },
    "public_read_api_started",
  );
}

main().catch((err) => {
  log.error({ err: String(err) }, "public_read_api_boot_failed");
  process.exit(1);
});
