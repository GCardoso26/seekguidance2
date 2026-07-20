/**
 * Pressão competitiva (1–10) — apenas roadmap ops; não é North Star.
 */

import { listPortfolioGames } from "./portfolioCatalog.js";

export type CompetitivePressureRow = {
  gameCode: string;
  displayName: string;
  /** 1 = baixa, 10 = alta */
  pressureScore: number;
};

/** Perfis operacionais (MRB / pesquisa de mercado); atualizar sem alterar ADR. */
const PRESSURE_BY_CODE: Record<string, number> = {
  LORCANA: 4,
  MTG: 10,
  POKEMON: 9,
  ONEPIECE: 7,
  DRAGONBALL: 6,
  DIGIMON: 3,
  RIFTBOUND: 1,
  NARUTO: 2,
};

export function buildCompetitivePressureReport(): {
  generatedAt: string;
  note: string;
  games: CompetitivePressureRow[];
} {
  return {
    generatedAt: new Date().toISOString(),
    note: "Indicador qualitativo para priorização de expansão — não usar receita nem GMV.",
    games: listPortfolioGames().map((g) => ({
      gameCode: g.gameCode,
      displayName: g.displayName,
      pressureScore: PRESSURE_BY_CODE[g.gameCode] ?? 2,
    })),
  };
}
