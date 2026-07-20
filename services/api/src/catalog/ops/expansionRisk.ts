import type { ProviderLifecycleStage } from "../providers/ProviderLifecycle.js";
import { getGameConfig } from "../providers/gameConfigRegistry.js";
import { capabilitiesScore } from "./capabilityMatrix.js";
import { listPortfolioGames } from "./portfolioCatalog.js";
import { PROVIDER_CERTIFICATION_PROFILES } from "./providerCertificationProfile.js";
import { buildMarketReadinessReport } from "./marketReadiness.js";

export type ExpansionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type ExpansionRiskRow = {
  gameCode: string;
  displayName: string;
  factors: {
    providerCoverage: number;
    capabilities: number;
    dataset: number;
    marketBr: number;
    documentation: number;
    certification: number;
    lifecycle: number;
  };
  risk: ExpansionRiskLevel;
};

function lifecycleFactor(stage: ProviderLifecycleStage): number {
  switch (stage) {
    case "beachhead":
    case "live":
      return 90;
    case "canary":
      return 75;
    case "shadow":
      return 55;
    case "implemented":
      return 45;
    case "planned":
      return 10;
    case "research":
    default:
      return 5;
  }
}

function certificationFactor(verdict: string | undefined): number {
  switch (verdict) {
    case "PASS":
      return 90;
    case "PENDING":
      return 50;
    case "FAIL":
      return 35;
    default:
      return 15;
  }
}

function riskFromScore(avg: number): ExpansionRiskLevel {
  if (avg >= 75) return "LOW";
  if (avg >= 55) return "MEDIUM";
  if (avg >= 35) return "HIGH";
  return "VERY_HIGH";
}

export function buildExpansionRiskReport(): {
  generatedAt: string;
  games: ExpansionRiskRow[];
} {
  const market = buildMarketReadinessReport();
  const marketByCode = Object.fromEntries(market.games.map((g) => [g.gameCode, g.readinessScore]));

  const games = listPortfolioGames().map((g) => {
    const profile = PROVIDER_CERTIFICATION_PROFILES.find((p) => p.gameCode === g.gameCode);
    const cfg = getGameConfig(g.gameCode);
    const factors = {
      providerCoverage: profile?.coveragePercent ?? 5,
      capabilities: cfg ? capabilitiesScore(cfg) : 5,
      dataset: profile ? (profile.cardsSynced > 100 ? 85 : profile.lifecycle === "planned" ? 5 : 40) : 5,
      marketBr: marketByCode[g.gameCode] ?? 0,
      documentation: cfg ? 80 : g.releaseTier === "R4" ? 25 : 40,
      certification: certificationFactor(profile?.certification),
      lifecycle: lifecycleFactor(g.lifecycle),
    };
    const avg =
      Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    const risk = riskFromScore(avg);
    return {
      gameCode: g.gameCode,
      displayName: g.displayName,
      factors,
      risk,
    };
  });

  return { generatedAt: new Date().toISOString(), games };
}
