/**
 * Periodic Golden Path smoke (Sprint 4.4).
 * Default: every 30 minutes. Detects degradations before users do.
 *
 * Env:
 *   SMOKE_INTERVAL_MS — default 30 * 60 * 1000
 *   SMOKE_ONCE=1      — run once and exit
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createLogger } from "../platform/logging/logger.js";
import {
  formatGoldenPathReport,
  runGoldenPathSmoke,
  type GoldenPathReport,
} from "../ops/goldenPath/runGoldenPathSmoke.js";

const log = createLogger("smoke-periodic");

const INTERVAL_MS = Number(process.env.SMOKE_INTERVAL_MS ?? 30 * 60 * 1000);
const ONCE = process.env.SMOKE_ONCE === "1";
const REPORT_DIR = process.env.SMOKE_REPORT_DIR ?? resolve(process.cwd(), "reports/smoke");

function writeReport(report: GoldenPathReport): string {
  mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = resolve(REPORT_DIR, `golden-path-${stamp}.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        passed: report.passed,
        offerCount: report.offerCount,
        deadOutbox: report.deadOutbox,
        steps: report.steps,
        timings: report.timings,
      },
      null,
      2,
    ),
  );
  const txt = resolve(REPORT_DIR, `golden-path-${stamp}.txt`);
  writeFileSync(txt, formatGoldenPathReport(report));
  return path;
}

async function tick(): Promise<boolean> {
  log.info("smoke_tick_start");
  const report = await runGoldenPathSmoke();
  const path = writeReport(report);
  if (report.passed) {
    log.info({ path, offerCount: report.offerCount }, "smoke_tick_ok");
  } else {
    log.error(
      { path, failed: report.steps.filter((s) => !s.ok).map((s) => s.id) },
      "smoke_tick_failed",
    );
  }
  return report.passed;
}

async function main(): Promise<void> {
  if (ONCE) {
    const ok = await tick();
    process.exit(ok ? 0 : 1);
  }

  log.info({ intervalMs: INTERVAL_MS, reportDir: REPORT_DIR }, "smoke_periodic_started");
  const ok = await tick();
  if (!ok) log.warn("initial_smoke_failed_continuing");

  setInterval(() => {
    void tick();
  }, INTERVAL_MS);
}

main().catch((err) => {
  log.error({ err: String(err) }, "smoke_periodic_crash");
  process.exit(1);
});
