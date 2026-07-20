/**
 * Prontidão de mercado — documentação operacional (MRB).
 * Não usa GMV nem integrações de pagamento.
 */

import { listPortfolioGames } from "./portfolioCatalog.js";

export type MarketReadinessIndicators = {
  gameCode: string;
  displayName: string;
  releaseTier: string;
  storeCountBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  collectorInterestBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  competitiveSceneBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  supplyBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  demandBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  competitionBand: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  beachhead: boolean;
  liquidityHypothesis: string;
  /** 0–100 sintético para ranking interno */
  readinessScore: number;
};

const PROFILES: Record<string, Omit<MarketReadinessIndicators, "gameCode" | "displayName" | "releaseTier">> = {
  LORCANA: {
    storeCountBand: "MEDIUM",
    collectorInterestBand: "HIGH",
    competitiveSceneBand: "MEDIUM",
    supplyBand: "MEDIUM",
    demandBand: "MEDIUM",
    competitionBand: "MEDIUM",
    beachhead: true,
    liquidityHypothesis: "Beachhead BR — provar loop recorrente antes de escalar catálogo",
    readinessScore: 63,
  },
  MTG: {
    storeCountBand: "HIGH",
    collectorInterestBand: "HIGH",
    competitiveSceneBand: "HIGH",
    supplyBand: "HIGH",
    demandBand: "HIGH",
    competitionBand: "HIGH",
    beachhead: false,
    liquidityHypothesis: "Massa crítica BR; provider em SHADOW até certificação",
    readinessScore: 72,
  },
  POKEMON: {
    storeCountBand: "HIGH",
    collectorInterestBand: "HIGH",
    competitiveSceneBand: "MEDIUM",
    supplyBand: "HIGH",
    demandBand: "HIGH",
    competitionBand: "HIGH",
    beachhead: false,
    liquidityHypothesis: "Demanda forte; dataset shadow até gate R2",
    readinessScore: 68,
  },
  ONEPIECE: {
    storeCountBand: "MEDIUM",
    collectorInterestBand: "HIGH",
    competitiveSceneBand: "MEDIUM",
    supplyBand: "MEDIUM",
    demandBand: "MEDIUM",
    competitionBand: "MEDIUM",
    beachhead: false,
    liquidityHypothesis: "Nicho Bandai com crescimento LATAM",
    readinessScore: 55,
  },
  DRAGONBALL: {
    storeCountBand: "MEDIUM",
    collectorInterestBand: "MEDIUM",
    competitiveSceneBand: "LOW",
    supplyBand: "MEDIUM",
    demandBand: "MEDIUM",
    competitionBand: "LOW",
    beachhead: false,
    liquidityHypothesis: "Fusion World — acompanhar adoção BR",
    readinessScore: 48,
  },
  DIGIMON: {
    storeCountBand: "LOW",
    collectorInterestBand: "MEDIUM",
    competitiveSceneBand: "LOW",
    supplyBand: "LOW",
    demandBand: "LOW",
    competitionBand: "LOW",
    beachhead: false,
    liquidityHypothesis: "Comunidade dedicada; oferta fragmentada",
    readinessScore: 40,
  },
  RIFTBOUND: {
    storeCountBand: "NONE",
    collectorInterestBand: "LOW",
    competitiveSceneBand: "NONE",
    supplyBand: "NONE",
    demandBand: "LOW",
    competitionBand: "LOW",
    beachhead: false,
    liquidityHypothesis: "R4 — aguardar lançamento oficial e evidência",
    readinessScore: 15,
  },
  NARUTO: {
    storeCountBand: "LOW",
    collectorInterestBand: "LOW",
    competitiveSceneBand: "LOW",
    supplyBand: "LOW",
    demandBand: "LOW",
    competitionBand: "LOW",
    beachhead: false,
    liquidityHypothesis: "R4 — validar mercado antes de provider",
    readinessScore: 12,
  },
};

const EMPTY_PROFILE: Omit<MarketReadinessIndicators, "gameCode" | "displayName" | "releaseTier"> = {
  storeCountBand: "NONE",
  collectorInterestBand: "NONE",
  competitiveSceneBand: "NONE",
  supplyBand: "NONE",
  demandBand: "NONE",
  competitionBand: "NONE",
  beachhead: false,
  liquidityHypothesis: "Sem hipótese documentada",
  readinessScore: 0,
};

export function buildMarketReadinessReport(): {
  generatedAt: string;
  note: string;
  games: MarketReadinessIndicators[];
} {
  return {
    generatedAt: new Date().toISOString(),
    note: "Bandas qualitativas para MRB — preencher com evidência de campo.",
    games: listPortfolioGames().map((g) => ({
      gameCode: g.gameCode,
      displayName: g.displayName,
      releaseTier: g.releaseTier,
      ...(PROFILES[g.gameCode] ?? EMPTY_PROFILE),
    })),
  };
}
