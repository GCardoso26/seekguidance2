import { buildCardgameReadinessReport } from "./cardgameReadiness.js";
import { buildMarketplaceCoverageReport } from "./marketplaceCoverage.js";
import { buildSellerBuyerCoverageReport } from "./sellerBuyerCoverage.js";
import { listPortfolioGames } from "./portfolioCatalog.js";
import { PROVIDER_CERTIFICATION_PROFILES } from "./providerCertificationProfile.js";

export type EcosystemHealthStatus = "GOOD" | "NOT_STARTED" | "IMPLEMENTED" | "PLANNED" | "RESEARCH";

export type EcosystemHealthRow = {
  gameCode: string;
  displayName: string;
  engineering: number;
  operations: number;
  market: number;
  business: number;
  overall: number;
  health: EcosystemHealthStatus;
};

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function engineeringScore(gameCode: string): number {
  const readiness = buildCardgameReadinessReport().games.find((g) => g.gameCode === gameCode);
  if (readiness) return readiness.overallPercent;
  const planned = listPortfolioGames().find((g) => g.gameCode === gameCode);
  if (!planned || (planned.lifecycle !== "planned" && planned.lifecycle !== "research")) return 20;
  return planned.releaseTier === "R4" || planned.lifecycle === "research" ? 12 : 25;
}

function operationsScore(gameCode: string): number {
  const p = PROVIDER_CERTIFICATION_PROFILES.find((x) => x.gameCode === gameCode);
  if (!p) {
    const g = listPortfolioGames().find((x) => x.gameCode === gameCode);
    return g?.lifecycle === "planned" || g?.lifecycle === "research" ? 3 : 15;
  }
  let score = p.coveragePercent * 0.4;
  if (p.certification === "PASS") score += 35;
  else if (p.certification === "PENDING") score += 20;
  else if (p.certification === "FAIL") score += 10;
  if (p.syncStatus === "OK") score += 15;
  if (p.pendingChecklist.length === 0) score += 10;
  return Math.min(100, Math.round(score));
}

function marketScore(gameCode: string): number {
  const snap = buildMarketplaceCoverageReport().snapshots.find((s) => s.gameCode === gameCode);
  if (!snap || snap.source === "placeholder") {
    const g = listPortfolioGames().find((x) => x.gameCode === gameCode);
    if (g?.lifecycle === "beachhead") {
      return avg([
        snap?.cardsWithListingPercent ?? 31,
        snap?.cardsWithStockPercent ?? 28,
        snap?.cardsSearchedPercent ?? 17,
      ]);
    }
    return 0;
  }
  return avg([
    snap.cardsWithListingPercent,
    snap.cardsWithStockPercent,
    snap.cardsSearchedPercent,
    snap.cardsWithLiquidityPercent,
  ]);
}

function businessScore(gameCode: string): number {
  const sellers = buildSellerBuyerCoverageReport().sellers.find((s) => s.gameCode === gameCode);
  const buyers = buildSellerBuyerCoverageReport().buyers.find((b) => b.gameCode === gameCode);
  if (!sellers || sellers.source === "placeholder") {
    if (gameCode === "LORCANA") {
      const funnel = [sellers?.activeStores ?? 5, buyers?.checkout ?? 4];
      return Math.min(100, funnel[0] * 3 + funnel[1] * 2);
    }
    return 0;
  }
  return avg([sellers.activeStores * 10, (buyers?.checkout ?? 0) * 5]);
}

function healthStatus(
  lifecycle: string,
  overall: number,
): EcosystemHealthStatus {
  if (lifecycle === "research") return "RESEARCH";
  if (lifecycle === "planned") return "PLANNED";
  if (lifecycle === "beachhead") return "GOOD";
  if (lifecycle === "implemented") return "IMPLEMENTED";
  if (lifecycle === "shadow") return "NOT_STARTED";
  if (lifecycle === "live" || lifecycle === "canary") return overall >= 60 ? "GOOD" : "NOT_STARTED";
  return "PLANNED";
}

/** Saúde do ecossistema por camada — não alimenta métricas de liquidez do North Star. */
export function buildEcosystemHealthReport(): {
  generatedAt: string;
  note: string;
  games: EcosystemHealthRow[];
} {
  const games = listPortfolioGames().map((g) => {
    const engineering = engineeringScore(g.gameCode);
    const operations = operationsScore(g.gameCode);
    const market = marketScore(g.gameCode);
    const business = businessScore(g.gameCode);
    const overall = avg([engineering, operations, market, business]);
    return {
      gameCode: g.gameCode,
      displayName: g.displayName,
      engineering,
      operations,
      market,
      business,
      overall,
      health: healthStatus(g.lifecycle, overall),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    note: "Camadas separadas (Engineering / Operations / Market / Business).",
    games,
  };
}
