import { runProductCatalogSyncJob } from "../cli/runProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { listProductCatalogJobs } from "../providers/registry.js";

const jobKey = process.argv[2] as ProductCatalogJobKey | undefined;
if (!jobKey || !listProductCatalogJobs().includes(jobKey)) {
  console.error(`Usage: sync-runner.ts <${listProductCatalogJobs().join("|")}>`);
  process.exit(1);
}

  const mode = process.argv.includes("--full") ? "full" : "incremental";
  const dryRun = process.argv.includes("--dry-run");
  const sinceIdx = process.argv.indexOf("--since");
  const syncSince = sinceIdx >= 0 ? process.argv[sinceIdx + 1] : undefined;

  runProductCatalogSyncJob(jobKey, { mode, dryRun, syncSince }).catch((err) => {
  console.error(err);
  process.exit(1);
});
