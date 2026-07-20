import type { ProviderLifecycleStage } from "../providers/ProviderLifecycle.js";

export interface ProviderCapabilities {
  cards: boolean;
  images: boolean;
  variants: boolean;
  prices: boolean;
  legality: boolean;
  rulings: boolean;
  languages: boolean;
  sealed: boolean;
  decks: boolean;
  metadata: boolean;
}

export const CATALOG_CAPABILITIES_NO_PRICES: ProviderCapabilities = {
  cards: true,
  images: true,
  variants: true,
  prices: false,
  legality: true,
  rulings: true,
  languages: true,
  sealed: false,
  decks: false,
  metadata: true,
};

export type RolloutMode = "OFF" | "SHADOW" | "CANARY" | "LIVE";

export interface ProviderHealth {
  status: "healthy" | "degraded" | "down" | "unknown";
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  uptimeRatio?: number;
  avgLatencyMs?: number;
  errorRate?: number;
}

export interface ProviderStatistics {
  requestsToday: number;
  requestsTotal: number;
  quotaRemaining?: number;
  quotaLimit?: number;
  syncCardsTotal: number;
  syncErrorsTotal: number;
  credits?: number;
  estimatedCost?: number;
  dailyCost?: number;
}

export interface RegisteredProvider {
  providerId: string;
  gameCode: string;
  kind: "catalog" | "pricing" | "currency" | "media";
  capabilities: ProviderCapabilities;
  mode: RolloutMode;
  /** Ciclo de vida formal — Planned→…→Beachhead */
  lifecycle: ProviderLifecycleStage;
  canaryPercent: number;
  health: ProviderHealth;
  statistics: ProviderStatistics;
}

export class ProviderRegistry {
  private providers = new Map<string, RegisteredProvider>();

  register(provider: RegisteredProvider): void {
    this.providers.set(`${provider.kind}:${provider.providerId}:${provider.gameCode}`, provider);
  }

  get(providerId: string, gameCode: string, kind: RegisteredProvider["kind"] = "catalog"): RegisteredProvider | undefined {
    return this.providers.get(`${kind}:${providerId}:${gameCode}`);
  }

  list(kind?: RegisteredProvider["kind"]): RegisteredProvider[] {
    const all = [...this.providers.values()];
    return kind ? all.filter((p) => p.kind === kind) : all;
  }

  supports(providerId: string, gameCode: string, capability: keyof ProviderCapabilities): boolean {
    const p = this.get(providerId, gameCode);
    return Boolean(p?.capabilities[capability]);
  }

  shouldRun(provider: RegisteredProvider, sample = Math.random() * 100): boolean {
    if (provider.mode === "OFF") return false;
    if (provider.mode === "LIVE" || provider.mode === "SHADOW") return true;
    if (provider.mode === "CANARY") return sample < provider.canaryPercent;
    return false;
  }

  recordSuccess(providerId: string, gameCode: string, latencyMs: number, cards = 0): void {
    const p = this.get(providerId, gameCode);
    if (!p) return;
    p.health.status = "healthy";
    p.health.lastSuccessAt = new Date().toISOString();
    p.health.avgLatencyMs = blend(p.health.avgLatencyMs, latencyMs);
    p.statistics.requestsToday += 1;
    p.statistics.requestsTotal += 1;
    p.statistics.syncCardsTotal += cards;
  }

  recordError(providerId: string, gameCode: string, message: string): void {
    const p = this.get(providerId, gameCode);
    if (!p) return;
    p.health.status = "degraded";
    p.health.lastErrorAt = new Date().toISOString();
    p.health.lastErrorMessage = message;
    p.statistics.requestsToday += 1;
    p.statistics.requestsTotal += 1;
    p.statistics.syncErrorsTotal += 1;
  }

  addCost(providerId: string, gameCode: string, cost: number): void {
    const p = this.get(providerId, gameCode);
    if (!p) return;
    p.statistics.estimatedCost = (p.statistics.estimatedCost ?? 0) + cost;
    p.statistics.dailyCost = (p.statistics.dailyCost ?? 0) + cost;
  }
}

function blend(prev: number | undefined, next: number): number {
  if (prev === undefined) return next;
  return prev * 0.8 + next * 0.2;
}

export const providerRegistry = new ProviderRegistry();
