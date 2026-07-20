import { getGameConfig } from "../providers/gameConfigRegistry.js";
import { capabilitiesScore } from "./capabilityMatrix.js";
import {
  PLANNED_GAME_CODES,
  PROVIDER_CERTIFICATION_PROFILES,
} from "./providerCertificationProfile.js";

export type ReadinessDimension = {
  id: string;
  label: string;
  /** 0–100 */
  percent: number;
};

export type CardgameReadinessRow = {
  gameCode: string;
  displayName: string;
  releaseTier: string;
  dimensions: ReadinessDimension[];
  overallPercent: number;
};

export type CardgameReadinessReport = {
  generatedAt: string;
  games: CardgameReadinessRow[];
};

function dim(id: string, label: string, percent: number): ReadinessDimension {
  return { id, label, percent: Math.max(0, Math.min(100, Math.round(percent))) };
}

function overall(dims: ReadinessDimension[]): number {
  if (!dims.length) return 0;
  const sum = dims.reduce((a, d) => a + d.percent, 0);
  return Math.round(sum / dims.length);
}

function readinessForImplemented(gameCode: string): CardgameReadinessRow | null {
  const profile = PROVIDER_CERTIFICATION_PROFILES.find((p) => p.gameCode === gameCode);
  const cfg = getGameConfig(gameCode);
  if (!profile || !cfg) return null;

  const provider =
    profile.certification === "PASS"
      ? 97
      : profile.certification === "FAIL"
        ? profile.coveragePercent
        : profile.coveragePercent;

  const capabilities = capabilitiesScore(cfg);
  const search =
    profile.searchProjectionStatus === "OK"
      ? 98
      : profile.searchProjectionStatus === "DEGRADED"
        ? 88
        : profile.lifecycle === "implemented"
          ? 70
          : 50;
  const filters = cfg.filterFacets.length >= 3 ? 95 : 80;
  const seller = profile.certification === "PASS" ? 94 : profile.rolloutMode === "SHADOW" ? 85 : 75;
  const buyer = profile.certification === "PASS" ? 93 : 80;
  const checkout = profile.lifecycle === "beachhead" || profile.lifecycle === "live" ? 100 : 85;

  const dimensions = [
    dim("provider", "Provider", provider),
    dim("capabilities", "Capabilities", capabilities),
    dim("search", "Search", search),
    dim("filters", "Filters", filters),
    dim("seller", "Seller", seller),
    dim("buyer", "Buyer", buyer),
    dim("checkout", "Checkout", checkout),
  ];

  return {
    gameCode,
    displayName: cfg.displayName,
    releaseTier: cfg.market.releaseTier,
    dimensions,
    overallPercent: overall(dimensions),
  };
}

function readinessForPlanned(
  gameCode: string,
  displayName: string,
  releaseTier: string,
): CardgameReadinessRow {
  const dimensions = [
    dim("provider", "Provider", 0),
    dim("capabilities", "Capabilities", 0),
    dim("search", "Search", 0),
    dim("filters", "Filters", 0),
    dim("seller", "Seller", 0),
    dim("buyer", "Buyer", 0),
    dim("checkout", "Checkout", 0),
  ];
  return {
    gameCode,
    displayName,
    releaseTier,
    dimensions,
    overallPercent: 0,
  };
}

export function buildCardgameReadinessReport(): CardgameReadinessReport {
  const implemented = ["LORCANA", "MTG", "POKEMON"]
    .map(readinessForImplemented)
    .filter((r): r is CardgameReadinessRow => r !== null);

  const planned = PLANNED_GAME_CODES.filter((g) =>
    ["ONEPIECE", "NARUTO"].includes(g.gameCode),
  ).map((g) => readinessForPlanned(g.gameCode, g.displayName, g.releaseTier));

  return {
    generatedAt: new Date().toISOString(),
    games: [...implemented, ...planned],
  };
}

export function formatCardgameReadinessMarkdown(report: CardgameReadinessReport): string {
  const lines: string[] = [
    "# Cardgame Readiness Report",
    "",
    `_Gerado em ${report.generatedAt}_`,
    "",
  ];
  for (const g of report.games) {
    lines.push(`## ${g.displayName} (${g.gameCode}) — ${g.releaseTier}`);
    lines.push("");
    for (const d of g.dimensions) {
      lines.push(`- **${d.label}**: ${d.percent}%`);
    }
    lines.push(`- **Overall**: ${g.overallPercent}%`);
    lines.push("");
  }
  return lines.join("\n");
}
