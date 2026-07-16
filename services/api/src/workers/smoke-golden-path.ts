/**
 * Official CI smoke — Sprint 4.4.
 * Usage: npm run smoke:golden-path
 * Exit 0 = green; Exit 1 = failed (blocks merge).
 */
import { createLogger } from "../platform/logging/logger.js";
import {
  formatGoldenPathReport,
  runGoldenPathSmoke,
} from "../ops/goldenPath/runGoldenPathSmoke.js";

const log = createLogger("smoke-golden-path");

async function main(): Promise<void> {
  const report = await runGoldenPathSmoke();
  const text = formatGoldenPathReport(report);
  // eslint-disable-next-line no-console
  console.log(text);
  if (!report.passed) {
    log.error({ steps: report.steps.filter((s) => !s.ok) }, "golden_path_failed");
    process.exit(1);
  }
  log.info({ offerCount: report.offerCount }, "golden_path_passed");
}

main().catch((err) => {
  log.error({ err: String(err) }, "golden_path_crash");
  process.exit(1);
});
