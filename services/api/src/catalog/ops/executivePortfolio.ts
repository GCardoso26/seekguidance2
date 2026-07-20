import { buildCompetitivePressureReport } from "./competitivePressure.js";
import { buildEcosystemHealthReport } from "./ecosystemHealth.js";
import { buildExpansionCostReport } from "./expansionCost.js";
import { buildExpansionRiskReport } from "./expansionRisk.js";
import { buildMaturityIndexReport } from "./maturityIndex.js";
import { listPortfolioGames } from "./portfolioCatalog.js";

export type ExecutivePortfolioRow = {
  gameCode: string;
  displayName: string;
  lifecycle: string;
  health: string;
  risk: string;
  pressure: number;
  expansionCost: string;
  overall: number;
  priority: number;
};

export function buildExecutivePortfolioReport(): {
  generatedAt: string;
  games: ExecutivePortfolioRow[];
} {
  const health = buildEcosystemHealthReport();
  const risk = buildExpansionRiskReport();
  const pressure = buildCompetitivePressureReport();
  const cost = buildExpansionCostReport();
  const maturity = buildMaturityIndexReport();

  const rows: ExecutivePortfolioRow[] = listPortfolioGames().map((g, index) => {
    const h = health.games.find((x) => x.gameCode === g.gameCode);
    const r = risk.games.find((x) => x.gameCode === g.gameCode);
    const p = pressure.games.find((x) => x.gameCode === g.gameCode);
    const c = cost.games.find((x) => x.gameCode === g.gameCode);
    const m = maturity.games.find((x) => x.gameCode === g.gameCode);
    return {
      gameCode: g.gameCode,
      displayName: g.displayName,
      lifecycle: g.lifecycle,
      health: h?.health ?? "PLANNED",
      risk: r?.risk ?? "VERY_HIGH",
      pressure: p?.pressureScore ?? 0,
      expansionCost: c?.total ?? "HIGH",
      overall: m?.overall ?? 0,
      priority: index + 1,
    };
  });

  return { generatedAt: new Date().toISOString(), games: rows };
}

export function formatExecutivePortfolioMarkdown(report: ReturnType<typeof buildExecutivePortfolioReport>): string {
  const lines = [
    "# Executive Portfolio",
    "",
    `_Gerado em ${report.generatedAt}_`,
    "",
    "| Game | Lifecycle | Health | Risk | Pressure | Expansion Cost | Overall | Priority |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of report.games) {
    lines.push(
      `| ${r.displayName} | ${r.lifecycle} | ${r.health} | ${r.risk} | ${r.pressure} | ${r.expansionCost} | ${r.overall} | ${r.priority} |`,
    );
  }
  return lines.join("\n");
}
