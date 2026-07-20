import { getGameConfig } from "../providers/gameConfigRegistry.js";
import { capabilitiesScore } from "./capabilityMatrix.js";
import { buildCompetitivePressureReport } from "./competitivePressure.js";
import { buildExpansionRiskReport } from "./expansionRisk.js";
import { buildMarketReadinessReport } from "./marketReadiness.js";
import { listPortfolioGames } from "./portfolioCatalog.js";

export type RoadmapRecommendationRow = {
  rank: number;
  gameCode: string;
  displayName: string;
  score: number;
};

const TIER_BOOST: Record<string, number> = {
  R1: 100,
  R2: 80,
  R3: 50,
  R4: 20,
};

const LIFECYCLE_BOOST: Record<string, number> = {
  beachhead: 95,
  live: 90,
  canary: 75,
  shadow: 70,
  implemented: 55,
  planned: 10,
  research: 5,
};

const RISK_PENALTY: Record<string, number> = {
  LOW: 0,
  MEDIUM: 8,
  HIGH: 18,
  VERY_HIGH: 30,
};

function roadmapScore(gameCode: string): number {
  const g = listPortfolioGames().find((x) => x.gameCode === gameCode);
  if (!g) return 0;
  const market = buildMarketReadinessReport().games.find((x) => x.gameCode === gameCode);
  const pressure = buildCompetitivePressureReport().games.find((x) => x.gameCode === gameCode);
  const risk = buildExpansionRiskReport().games.find((x) => x.gameCode === gameCode);
  const cfg = getGameConfig(gameCode);
  const cap = cfg ? capabilitiesScore(cfg) : 0;

  const base =
    (TIER_BOOST[g.releaseTier] ?? 0) +
    (LIFECYCLE_BOOST[g.lifecycle] ?? 0) +
    (market?.readinessScore ?? 0) * 0.35 +
    (pressure?.pressureScore ?? 0) * 2.5 +
    cap * 0.2;

  const penalty = RISK_PENALTY[risk?.risk ?? "VERY_HIGH"];
  return Math.round(base - penalty);
}

/**
 * Prioridade de expansão — não usa GMV, receita nem métricas do North Star.
 */
export function buildRoadmapRecommendationReport(): {
  generatedAt: string;
  note: string;
  rankings: RoadmapRecommendationRow[];
} {
  const rankings = listPortfolioGames().map((g, i) => ({
    rank: i + 1,
    gameCode: g.gameCode,
    displayName: g.displayName,
    score: roadmapScore(g.gameCode),
  }));

  return {
    generatedAt: new Date().toISOString(),
    note:
      "Ordem de rank segue allowlist ADR-013; score consolida lifecycle, risco, pressão, capabilities e market readiness.",
    rankings,
  };
}

export function formatRoadmapRecommendationMarkdown(
  report: ReturnType<typeof buildRoadmapRecommendationReport>,
): string {
  const lines = [
    "# Portfolio Roadmap Recommendation",
    "",
    `_Gerado em ${report.generatedAt}_`,
    "",
    report.note,
    "",
  ];
  for (const r of report.rankings) {
    lines.push(`${r.rank}. **${r.displayName}** (\`${r.gameCode}\`) — score ${r.score}`);
  }
  return lines.join("\n");
}
