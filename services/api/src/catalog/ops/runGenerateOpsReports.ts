/**
 * CLI — gera JSON em testing/reports, markdown em docs/operations/generated,
 * e PROJECT_STATUS.md na raiz do repositório.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildOpsReportsBundle,
  opsReportsMarkdownSections,
} from "./generateOpsReports.js";
import { formatProjectStatusMarkdown } from "./projectStatus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** `services/api` — ops → catalog → src → api */
const apiRoot = path.resolve(__dirname, "../../..");
/** monorepo root */
const repoRoot = path.resolve(apiRoot, "../..");
const testingRoot = path.join(repoRoot, "testing");

function main() {
  const bundle = buildOpsReportsBundle();
  const sections = opsReportsMarkdownSections(bundle);

  const outDir = path.join(testingRoot, "reports");
  const mdDir = path.join(repoRoot, "docs", "operations", "generated");
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(mdDir, { recursive: true });

  const jsonFiles: Record<string, unknown> = {
    "ops-bundle-latest.json": bundle,
    "provider-certification-dashboard.json": bundle.providerCertificationDashboard,
    "cardgame-readiness.json": bundle.cardgameReadiness,
    "capability-matrix.json": bundle.capabilityMatrix,
    "marketplace-coverage.json": bundle.marketplaceCoverage,
    "seller-buyer-coverage.json": bundle.sellerBuyerCoverage,
    "readiness-matrix.json": bundle.readinessMatrix,
    "ecosystem-health.json": bundle.ecosystemHealth,
    "market-readiness.json": bundle.marketReadiness,
    "competitive-pressure.json": bundle.competitivePressure,
    "expansion-risk.json": bundle.expansionRisk,
    "expansion-cost.json": bundle.expansionCost,
    "maturity-index.json": bundle.maturityIndex,
    "executive-portfolio.json": bundle.executivePortfolio,
    "roadmap-recommendation.json": bundle.roadmapRecommendation,
    "project-status.json": bundle.projectStatus,
  };

  for (const [name, data] of Object.entries(jsonFiles)) {
    fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  }

  for (const [name, body] of Object.entries(sections)) {
    fs.writeFileSync(path.join(mdDir, name), body, "utf8");
  }

  const projectStatusMd = formatProjectStatusMarkdown(bundle.projectStatus);
  fs.writeFileSync(path.join(repoRoot, "PROJECT_STATUS.md"), projectStatusMd, "utf8");

  console.log("✓ ops reports");
  console.log(`  providers: ${bundle.providerCertificationDashboard.providers.length}`);
  console.log(`  games readiness: ${bundle.cardgameReadiness.games.length}`);
  console.log(`  roadmap ranks: ${bundle.roadmapRecommendation.rankings.length}`);
  console.log(`  → ${path.relative(repoRoot, outDir)}`);
  console.log(`  → ${path.relative(repoRoot, mdDir)}`);
  console.log(`  → PROJECT_STATUS.md`);
}

main();
