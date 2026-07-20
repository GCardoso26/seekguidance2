/**
 * Ciclo de vida formal do Catalog Provider (ADR-006 + beachhead ADR-012).
 *
 * Research → Planned → Implemented → Shadow → Canary → Live → Beachhead
 *
 * RolloutMode (OFF|SHADOW|CANARY|LIVE) continua sendo o mecanismo de execução.
 * LifecycleStage é a visão operacional/produto — Beachhead só para o TCG R1 (Lorcana).
 * Research = allowlist futura / mercado ainda em estudo (sem compromisso de Playbook).
 */

export type ProviderLifecycleStage =
  | "research"
  | "planned"
  | "implemented"
  | "shadow"
  | "canary"
  | "live"
  | "beachhead";

/** Espelha RolloutMode do registry (sem import circular). */
export type LifecycleRolloutMode = "OFF" | "SHADOW" | "CANARY" | "LIVE";

export const PROVIDER_LIFECYCLE_ORDER: ProviderLifecycleStage[] = [
  "research",
  "planned",
  "implemented",
  "shadow",
  "canary",
  "live",
  "beachhead",
];

const ALLOWED: Record<ProviderLifecycleStage, ProviderLifecycleStage[]> = {
  research: ["planned"],
  planned: ["implemented", "research"],
  implemented: ["shadow", "planned"],
  shadow: ["canary", "implemented"],
  canary: ["live", "shadow"],
  live: ["beachhead", "canary", "shadow"],
  beachhead: ["live"],
};

export function canTransitionLifecycle(
  from: ProviderLifecycleStage,
  to: ProviderLifecycleStage,
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function lifecycleFromRollout(
  mode: LifecycleRolloutMode,
  opts: { beachhead?: boolean; codeExists?: boolean } = {},
): ProviderLifecycleStage {
  if (opts.beachhead && mode === "LIVE") return "beachhead";
  switch (mode) {
    case "SHADOW":
      return "shadow";
    case "CANARY":
      return "canary";
    case "LIVE":
      return "live";
    case "OFF":
    default:
      return opts.codeExists === false ? "planned" : "implemented";
  }
}

export function rolloutModeForLifecycle(stage: ProviderLifecycleStage): LifecycleRolloutMode {
  switch (stage) {
    case "research":
    case "planned":
    case "implemented":
      return "OFF";
    case "shadow":
      return "SHADOW";
    case "canary":
      return "CANARY";
    case "live":
    case "beachhead":
      return "LIVE";
  }
}

export function isMarketplaceVisible(stage: ProviderLifecycleStage): boolean {
  return stage === "live" || stage === "beachhead" || stage === "canary";
}

export function isSyncAllowed(stage: ProviderLifecycleStage): boolean {
  return stage !== "research" && stage !== "planned";
}
