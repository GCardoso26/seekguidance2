/**
 * Perfis de certificação (engenharia) — não são métricas de mercado Beta.
 * Atualizar quando checklist SHADOW→LIVE avançar.
 */

import type { ProviderLifecycleStage } from "../providers/ProviderLifecycle.js";

export type CertificationVerdict = "PASS" | "FAIL" | "PENDING" | "N/A";

export type ProviderCertificationProfile = {
  gameCode: string;
  displayName: string;
  lifecycle: ProviderLifecycleStage;
  rolloutMode: "OFF" | "SHADOW" | "CANARY" | "LIVE";
  /** 0–100 */
  coveragePercent: number;
  cardsSynced: number;
  imagesPercent: number;
  variantsPercent: number;
  syncStatus: "OK" | "DEGRADED" | "FAIL";
  searchProjectionStatus: "OK" | "DEGRADED" | "FAIL" | "N/A";
  certification: CertificationVerdict;
  pendingChecklist: string[];
};

export const PROVIDER_CERTIFICATION_PROFILES: ProviderCertificationProfile[] = [
  {
    gameCode: "LORCANA",
    displayName: "Disney Lorcana",
    lifecycle: "beachhead",
    rolloutMode: "LIVE",
    coveragePercent: 99.8,
    cardsSynced: 2389,
    imagesPercent: 100,
    variantsPercent: 100,
    syncStatus: "OK",
    searchProjectionStatus: "OK",
    certification: "PASS",
    pendingChecklist: [],
  },
  {
    gameCode: "MTG",
    displayName: "Magic: The Gathering",
    lifecycle: "shadow",
    rolloutMode: "SHADOW",
    coveragePercent: 96,
    cardsSynced: 0,
    imagesPercent: 99,
    variantsPercent: 92,
    syncStatus: "OK",
    searchProjectionStatus: "DEGRADED",
    certification: "FAIL",
    pendingChecklist: [
      "Collector Number mapping completo",
      "Double-faced cards (DFC)",
      "Etched finish em variants",
      "SHADOW exit gate assinado",
    ],
  },
  {
    gameCode: "POKEMON",
    displayName: "Pokémon TCG",
    lifecycle: "implemented",
    rolloutMode: "OFF",
    coveragePercent: 85,
    cardsSynced: 5,
    imagesPercent: 100,
    variantsPercent: 100,
    syncStatus: "OK",
    searchProjectionStatus: "N/A",
    certification: "PENDING",
    pendingChecklist: [
      "Scryfall CANARY/LIVE estável (ADR-006)",
      "Dataset além do seed shadow",
      "Certification SHADOW completa",
    ],
  },
];

/** R3/R4 — scaffold para matriz/readiness (sem provider LIVE). */
export const PLANNED_GAME_CODES = [
  { gameCode: "ONEPIECE", displayName: "One Piece", releaseTier: "R3" as const, lifecycle: "planned" as ProviderLifecycleStage },
  { gameCode: "DIGIMON", displayName: "Digimon", releaseTier: "R3" as const, lifecycle: "planned" as ProviderLifecycleStage },
  { gameCode: "DRAGONBALL", displayName: "Dragon Ball FW", releaseTier: "R3" as const, lifecycle: "planned" as ProviderLifecycleStage },
  { gameCode: "RIFTBOUND", displayName: "Riftbound", releaseTier: "R4" as const, lifecycle: "research" as ProviderLifecycleStage },
  { gameCode: "NARUTO", displayName: "Naruto TCG", releaseTier: "R4" as const, lifecycle: "research" as ProviderLifecycleStage },
];
