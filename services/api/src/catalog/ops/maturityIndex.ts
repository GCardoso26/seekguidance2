import { buildCompetitivePressureReport } from "./competitivePressure.js";
import { buildEcosystemHealthReport } from "./ecosystemHealth.js";
import { buildExpansionCostReport } from "./expansionCost.js";
import { buildExpansionRiskReport } from "./expansionRisk.js";
import { buildMarketReadinessReport } from "./marketReadiness.js";
import { listPortfolioGames } from "./portfolioCatalog.js";

export type MaturityIndexRow = {
  gameCode: string;
  displayName: string;
  engineering: number;
  operations: number;
  market: number;
  business: number;
  expansion: number;
  overall: number;
};

function expansionMaturity(gameCode: string): number {
  const risk = buildExpansionRiskReport().games.find((g) => g.gameCode === gameCode);
  const cost = buildExpansionCostReport().games.find((g) => g.gameCode === gameCode);
  const pressure = buildCompetitivePressureReport().games.find((g) => g.gameCode === gameCode);
  const market = buildMarketReadinessReport().games.find((g) => g.gameCode === gameCode);
  const riskMap = { LOW: 90, MEDIUM: 65, HIGH: 40, VERY_HIGH: 15 };
  const costMap = { LOW: 85, MEDIUM: 55, HIGH: 25 };
  const riskScore = risk ? riskMap[risk.risk] : 10;
  const costScore = cost ? costMap[cost.total] : 20;
  const pressureScore = pressure ? pressure.pressureScore * 8 : 10;
  const marketScore = market?.readinessScore ?? 0;
  return Math.round((riskScore + costScore + pressureScore + marketScore) / 4);
}

/**
 * Índice de maturidade do portfólio — referência ops apenas.
 * Métricas de liquidez do North Star não entram no cálculo.
 */
export function buildMaturityIndexReport(): {
  generatedAt: string;
  note: string;
  games: MaturityIndexRow[];
} {
  const health = buildEcosystemHealthReport();
  const games = listPortfolioGames().map((g) => {
    const h = health.games.find((x) => x.gameCode === g.gameCode);
    const engineering = h?.engineering ?? 0;
    const operations = h?.operations ?? 0;
    const market = h?.market ?? 0;
    const business = h?.business ?? 0;
    const expansion = expansionMaturity(g.gameCode);
    const overall = Math.round((engineering + operations + market + business + expansion) / 5);
    return {
      gameCode: g.gameCode,
      displayName: g.displayName,
      engineering,
      operations,
      market,
      business,
      expansion,
      overall,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    note: "Consolidação R3 — North Star permanece fonte de liquidez em R1.",
    games,
  };
}
