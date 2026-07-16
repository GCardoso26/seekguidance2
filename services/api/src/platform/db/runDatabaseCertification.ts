import { PERFORMANCE_BUDGET, runDatabaseCertification } from "./databaseCertification.js";

async function main(): Promise<void> {
  const url = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "Database Certification requires DATABASE_URL or CONTRACT_DATABASE_URL.\n" +
        "See docs/architecture/DATABASE_CERTIFICATION.md",
    );
    process.exit(1);
  }

  console.log("Running Database Certification…");
  console.log("Performance budget:", PERFORMANCE_BUDGET);

  const report = await runDatabaseCertification(url);
  for (const c of report.checks) {
    const mark = c.ok ? "✓" : "✗";
    const timing = c.ms != null ? ` (${c.ms.toFixed(2)}ms)` : "";
    console.log(`${mark} ${c.id}: ${c.detail}${timing}`);
  }

  if (!report.passed) {
    console.error("\nDatabase Certification FAILED");
    process.exit(1);
  }
  console.log("\nDatabase Certification PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
