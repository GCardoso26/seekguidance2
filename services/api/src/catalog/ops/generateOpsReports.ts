import { buildCapabilityMatrix } from "./capabilityMatrix.js";
import { buildCardgameReadinessReport, formatCardgameReadinessMarkdown } from "./cardgameReadiness.js";
import {
  buildProviderCertificationDashboard,
  formatProviderCertificationMarkdown,
} from "./certificationDashboard.js";
import { buildCompetitivePressureReport } from "./competitivePressure.js";
import { buildEcosystemHealthReport } from "./ecosystemHealth.js";
import {
  buildExecutivePortfolioReport,
  formatExecutivePortfolioMarkdown,
} from "./executivePortfolio.js";
import { buildExpansionCostReport } from "./expansionCost.js";
import { buildExpansionRiskReport } from "./expansionRisk.js";
import { buildMarketReadinessReport } from "./marketReadiness.js";
import { buildMarketplaceCoverageReport } from "./marketplaceCoverage.js";
import { buildMaturityIndexReport } from "./maturityIndex.js";
import {
  buildRoadmapRecommendationReport,
  formatRoadmapRecommendationMarkdown,
} from "./roadmapRecommendation.js";
import { buildReadinessMatrix, formatReadinessMatrixMarkdown } from "./readinessMatrix.js";
import { buildSellerBuyerCoverageReport } from "./sellerBuyerCoverage.js";
import { buildProjectStatusSnapshot, formatProjectStatusMarkdown } from "./projectStatus.js";

export type OpsReportsBundle = {
  generatedAt: string;
  providerCertificationDashboard: ReturnType<typeof buildProviderCertificationDashboard>;
  cardgameReadiness: ReturnType<typeof buildCardgameReadinessReport>;
  capabilityMatrix: ReturnType<typeof buildCapabilityMatrix>;
  marketplaceCoverage: ReturnType<typeof buildMarketplaceCoverageReport>;
  sellerBuyerCoverage: ReturnType<typeof buildSellerBuyerCoverageReport>;
  readinessMatrix: ReturnType<typeof buildReadinessMatrix>;
  ecosystemHealth: ReturnType<typeof buildEcosystemHealthReport>;
  marketReadiness: ReturnType<typeof buildMarketReadinessReport>;
  competitivePressure: ReturnType<typeof buildCompetitivePressureReport>;
  expansionRisk: ReturnType<typeof buildExpansionRiskReport>;
  expansionCost: ReturnType<typeof buildExpansionCostReport>;
  maturityIndex: ReturnType<typeof buildMaturityIndexReport>;
  executivePortfolio: ReturnType<typeof buildExecutivePortfolioReport>;
  roadmapRecommendation: ReturnType<typeof buildRoadmapRecommendationReport>;
  projectStatus: ReturnType<typeof buildProjectStatusSnapshot>;
};

export function buildOpsReportsBundle(): OpsReportsBundle {
  const generatedAt = new Date().toISOString();
  const roadmapRecommendation = buildRoadmapRecommendationReport();
  const executivePortfolio = buildExecutivePortfolioReport();
  const rankByCode = Object.fromEntries(
    roadmapRecommendation.rankings.map((r) => [r.gameCode, r.rank]),
  );
  executivePortfolio.games.forEach((g) => {
    g.priority = rankByCode[g.gameCode] ?? g.priority;
  });

  return {
    generatedAt,
    providerCertificationDashboard: buildProviderCertificationDashboard(),
    cardgameReadiness: buildCardgameReadinessReport(),
    capabilityMatrix: buildCapabilityMatrix(["ONEPIECE"]),
    marketplaceCoverage: buildMarketplaceCoverageReport(),
    sellerBuyerCoverage: buildSellerBuyerCoverageReport(),
    readinessMatrix: buildReadinessMatrix(),
    ecosystemHealth: buildEcosystemHealthReport(),
    marketReadiness: buildMarketReadinessReport(),
    competitivePressure: buildCompetitivePressureReport(),
    expansionRisk: buildExpansionRiskReport(),
    expansionCost: buildExpansionCostReport(),
    maturityIndex: buildMaturityIndexReport(),
    executivePortfolio,
    roadmapRecommendation,
    projectStatus: buildProjectStatusSnapshot(),
  };
}

export function formatEcosystemHealthMarkdown(
  report: ReturnType<typeof buildEcosystemHealthReport>,
): string {
  const lines = [
    "# Ecosystem Health",
    "",
    `_Gerado em ${report.generatedAt}_`,
    "",
    report.note,
    "",
    "| Game | Engineering | Operations | Market | Business | Overall | Health |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const g of report.games) {
    lines.push(
      `| ${g.displayName} | ${g.engineering} | ${g.operations} | ${g.market} | ${g.business} | ${g.overall} | ${g.health} |`,
    );
  }
  return lines.join("\n");
}

export function formatExecutiveSummaryMarkdown(bundle: OpsReportsBundle): string {
  const lines = [
    "# Resumo executivo — portfólio R3",
    "",
    `_Gerado em ${bundle.generatedAt}_`,
    "",
    "Framework de expansão (ops). Não altera North Star nem ADRs.",
    "",
    "## Prioridade de expansão",
    "",
  ];
  for (const r of bundle.roadmapRecommendation.rankings) {
    lines.push(`${r.rank}. ${r.displayName}`);
  }
  lines.push("", "## Saúde do ecossistema (top 3)", "");
  const topHealth = [...bundle.ecosystemHealth.games]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3);
  for (const g of topHealth) {
    lines.push(`- **${g.displayName}**: overall ${g.overall} (${g.health})`);
  }
  lines.push("", "## Risco de expansão", "");
  for (const g of bundle.expansionRisk.games.filter((x) => x.risk === "HIGH" || x.risk === "VERY_HIGH")) {
    lines.push(`- ${g.displayName}: **${g.risk}**`);
  }
  return lines.join("\n");
}

export function opsReportsMarkdownSections(bundle: OpsReportsBundle): Record<string, string> {
  return {
    "provider-certification-dashboard.md": formatProviderCertificationMarkdown(
      bundle.providerCertificationDashboard,
    ),
    "cardgame-readiness.md": formatCardgameReadinessMarkdown(bundle.cardgameReadiness),
    "readiness-matrix.md": formatReadinessMatrixMarkdown(bundle.readinessMatrix),
    "ecosystem-health.md": formatEcosystemHealthMarkdown(bundle.ecosystemHealth),
    "executive-portfolio.md": formatExecutivePortfolioMarkdown(bundle.executivePortfolio),
    "roadmap-recommendation.md": formatRoadmapRecommendationMarkdown(bundle.roadmapRecommendation),
    "executive-summary.md": formatExecutiveSummaryMarkdown(bundle),
    "project-status.md": formatProjectStatusMarkdown(bundle.projectStatus),
  };
}
