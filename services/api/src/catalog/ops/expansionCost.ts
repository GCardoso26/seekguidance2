import type { ProviderLifecycleStage } from "../providers/ProviderLifecycle.js";
import { getGameConfig } from "../providers/gameConfigRegistry.js";
import { listPortfolioGames } from "./portfolioCatalog.js";

export type RelativeCostBand = "LOW" | "MEDIUM" | "HIGH";

export type ExpansionCostRow = {
  gameCode: string;
  displayName: string;
  provider: RelativeCostBand;
  images: RelativeCostBand;
  metadata: RelativeCostBand;
  capabilities: RelativeCostBand;
  filters: RelativeCostBand;
  search: RelativeCostBand;
  testing: RelativeCostBand;
  certification: RelativeCostBand;
  total: RelativeCostBand;
};

function bandFromScore(score: number): RelativeCostBand {
  if (score <= 10) return "LOW";
  if (score <= 18) return "MEDIUM";
  return "HIGH";
}

function lifecycleCost(stage: ProviderLifecycleStage): number {
  switch (stage) {
    case "beachhead":
    case "live":
      return 0;
    case "canary":
      return 2;
    case "shadow":
      return 4;
    case "implemented":
      return 6;
    case "planned":
      return 10;
    case "research":
    default:
      return 12;
  }
}

export function buildExpansionCostReport(): {
  generatedAt: string;
  note: string;
  games: ExpansionCostRow[];
} {
  const games = listPortfolioGames().map((g) => {
    const cfg = getGameConfig(g.gameCode);
    const facetCount = cfg?.filterFacets.length ?? 0;
    const finishCount = cfg?.finishes.length ?? 0;
    const base = lifecycleCost(g.lifecycle);

    const provider = bandFromScore(base + (g.lifecycle === "planned" || g.lifecycle === "research" ? 8 : 2));
    const images = bandFromScore(
      base + (g.gameCode === "MTG" ? 6 : g.lifecycle === "planned" || g.lifecycle === "research" ? 5 : 2),
    );
    const metadata = bandFromScore(
      base +
        (g.gameCode === "MTG"
          ? 8
          : g.gameCode === "POKEMON"
            ? 5
            : g.lifecycle === "planned" || g.lifecycle === "research"
              ? 6
              : 3),
    );
    const capabilities = bandFromScore(base + (finishCount > 4 ? 4 : 2));
    const filters = bandFromScore(base + (facetCount >= 3 ? 2 : 5));
    const search = bandFromScore(base + (g.lifecycle === "shadow" ? 4 : 2));
    const testing = bandFromScore(base + 3);
    const certification = bandFromScore(
      base + (g.lifecycle === "planned" || g.lifecycle === "research" ? 5 : 3),
    );

    const weights = { LOW: 1, MEDIUM: 2, HIGH: 3 } as const;
    const sum =
      weights[provider] +
      weights[images] +
      weights[metadata] +
      weights[capabilities] +
      weights[filters] +
      weights[search] +
      weights[testing] +
      weights[certification];

    return {
      gameCode: g.gameCode,
      displayName: g.displayName,
      provider,
      images,
      metadata,
      capabilities,
      filters,
      search,
      testing,
      certification,
      total: bandFromScore(sum),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    note: "Pesos relativos do Expansion Playbook — não são estimativas em horas.",
    games,
  };
}
