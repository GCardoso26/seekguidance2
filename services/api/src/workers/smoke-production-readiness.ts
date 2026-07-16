/**
 * npm run smoke:production-readiness
 */
import {
  formatProductionReadinessReport,
  runProductionReadinessSmoke,
} from "../ops/goldenPath/runProductionReadinessSmoke.js";

async function main(): Promise<void> {
  const report = await runProductionReadinessSmoke();
  console.log(formatProductionReadinessReport(report));
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
