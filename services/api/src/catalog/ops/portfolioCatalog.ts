/**
 * Catálogo do portfólio (ADR-013) — ordem canônica para roadmap ops.
 * Sem providers novos; apenas metadados de expansão.
 */

import type { ProviderLifecycleStage } from "../providers/ProviderLifecycle.js";
import { PLANNED_GAME_CODES, PROVIDER_CERTIFICATION_PROFILES } from "./providerCertificationProfile.js";

export type PortfolioGameRef = {
  gameCode: string;
  displayName: string;
  releaseTier: "R1" | "R2" | "R3" | "R4";
  lifecycle: ProviderLifecycleStage;
};

const CODE_ORDER = [
  "LORCANA",
  "MTG",
  "POKEMON",
  "ONEPIECE",
  "DRAGONBALL",
  "DIGIMON",
  "RIFTBOUND",
  "NARUTO",
];

export function listPortfolioGames(): PortfolioGameRef[] {
  const implemented: PortfolioGameRef[] = PROVIDER_CERTIFICATION_PROFILES.map((p) => {
    const tier =
      p.gameCode === "LORCANA" ? "R1" : p.gameCode === "MTG" || p.gameCode === "POKEMON" ? "R2" : "R3";
    return {
      gameCode: p.gameCode,
      displayName: p.displayName,
      releaseTier: tier,
      lifecycle: p.lifecycle,
    };
  });

  const planned: PortfolioGameRef[] = PLANNED_GAME_CODES.map((p) => ({
    gameCode: p.gameCode,
    displayName: p.displayName,
    releaseTier: p.releaseTier,
    lifecycle: p.lifecycle,
  }));

  return [...implemented, ...planned].sort(
    (a, b) =>
      (CODE_ORDER.indexOf(a.gameCode) === -1 ? 999 : CODE_ORDER.indexOf(a.gameCode)) -
      (CODE_ORDER.indexOf(b.gameCode) === -1 ? 999 : CODE_ORDER.indexOf(b.gameCode)),
  );
}

export function portfolioGame(gameCode: string): PortfolioGameRef | undefined {
  return listPortfolioGames().find((g) => g.gameCode === gameCode.toUpperCase());
}
