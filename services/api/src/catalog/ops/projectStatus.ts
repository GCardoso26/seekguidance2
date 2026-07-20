/**
 * PROJECT_STATUS.md — snapshot da plataforma para onboarding (ops).
 * North Star values aqui são espelho do experimento de mercado — não inventar.
 */

import { listPortfolioGames } from "./portfolioCatalog.js";
import { buildMaturityIndexReport } from "./maturityIndex.js";
import { buildRoadmapRecommendationReport } from "./roadmapRecommendation.js";

export type ProjectStatusSnapshot = {
  generatedAt: string;
  platformStage: string;
  architecturePercent: number;
  testingPercent: number;
  providers: Array<{ gameCode: string; displayName: string; lifecycle: string }>;
  /** Métricas de produto — zeros até Beta real (North Star). */
  northStar: {
    lpc: number;
    lcsPercent: number;
    note: string;
  };
  beta: {
    status: string;
  };
  nextPhase: string;
};

/** Valores de produto: só alterar quando Beta/MRB reportar evidência real. */
const NORTH_STAR_MIRROR = {
  lpc: 0,
  lcsPercent: 0,
  note: "Espelho do North Star R1 — não usar readiness ops como substituto.",
};

const BETA_MIRROR = {
  status: "Not started",
};

function bar(percent: number): string {
  const filled = Math.round(percent / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export function buildProjectStatusSnapshot(): ProjectStatusSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    platformStage: "Framework Complete",
    architecturePercent: 100,
    testingPercent: 100,
    providers: listPortfolioGames().map((g) => ({
      gameCode: g.gameCode,
      displayName: g.displayName,
      lifecycle: g.lifecycle.toUpperCase(),
    })),
    northStar: { ...NORTH_STAR_MIRROR },
    beta: { ...BETA_MIRROR },
    nextPhase: "Evidence Release (R4) → Market Learning (R5)",
  };
}

export function formatProjectStatusMarkdown(snapshot: ProjectStatusSnapshot): string {
  const maturity = buildMaturityIndexReport();
  const roadmap = buildRoadmapRecommendationReport();
  const lines = [
    "# JudgeTCG — Project Status",
    "",
    `> Gerado automaticamente em \`${snapshot.generatedAt}\` via \`npm run test:ops-reports\`.`,
    `> **Leia isto primeiro.** Depois: [Platform Constitution](docs/architecture/PLATFORM_CONSTITUTION.md) · ADRs · North Star.`,
    "",
    "## Platform Stage",
    "",
    `**${snapshot.platformStage}**`,
    "",
    "| Área | Progresso |",
    "| --- | --- |",
    `| Architecture | ${bar(snapshot.architecturePercent)} ${snapshot.architecturePercent}% |`,
    `| Testing | ${bar(snapshot.testingPercent)} ${snapshot.testingPercent}% |`,
    "",
    "## Providers",
    "",
    "| Game | Lifecycle |",
    "| --- | --- |",
  ];

  for (const p of snapshot.providers) {
    lines.push(`| ${p.displayName} | ${p.lifecycle} |`);
  }

  lines.push(
    "",
    "## North Star (produto — beachhead)",
    "",
    `| Métrica | Valor |`,
    `| --- | --- |`,
    `| LPC | ${snapshot.northStar.lpc} |`,
    `| LCS | ${snapshot.northStar.lcsPercent}% |`,
    "",
    `_${snapshot.northStar.note}_`,
    "",
    "## Beta",
    "",
    `**${snapshot.beta.status}**`,
    "",
    "## Next phase",
    "",
    snapshot.nextPhase,
    "",
    "## Roadmap rank (ops — allowlist ADR-013)",
    "",
  );

  for (const r of roadmap.rankings) {
    lines.push(`${r.rank}. ${r.displayName}`);
  }

  lines.push(
    "",
    "## Maturity (ops — não é North Star)",
    "",
    "| Game | Overall |",
    "| --- | --- |",
  );
  for (const g of maturity.games) {
    lines.push(`| ${g.displayName} | ${g.overall} |`);
  }

  lines.push(
    "",
    "---",
    "",
    "**Platform Guardian:** preservar a Constituição; recusar complexidade sem redução de incerteza.",
    "",
  );

  return lines.join("\n");
}
