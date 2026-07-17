import { flagStore } from "../../platform/feature-flags/FlagStore.js";
import { createLogger } from "../../platform/logging/logger.js";
import { metrics } from "../../platform/metrics/registry.js";
import {
  providerRegistry,
  CATALOG_CAPABILITIES_NO_PRICES,
  type RegisteredProvider,
} from "../registry/ProviderRegistry.js";
import { createCatalogProvider } from "../providers/factory.js";
import type { SyncContext } from "../providers/interfaces/CatalogProvider.js";

const log = createLogger("catalog-sync");

export function bootstrapScryfallRegistry(): RegisteredProvider {
  const registered: RegisteredProvider = {
    providerId: "scryfall",
    gameCode: "MTG",
    kind: "catalog",
    capabilities: { ...CATALOG_CAPABILITIES_NO_PRICES },
    mode: (process.env.SCRYFALL_ROLLOUT_MODE as RegisteredProvider["mode"]) ?? "SHADOW",
    canaryPercent: Number(process.env.SCRYFALL_CANARY_PERCENT ?? 10),
    health: { status: "unknown" },
    statistics: {
      requestsToday: 0,
      requestsTotal: 0,
      syncCardsTotal: 0,
      syncErrorsTotal: 0,
    },
  };
  providerRegistry.register(registered);
  return registered;
}

/** Beachhead R1 — ADR-012 / beachhead.ts */
export function bootstrapLorcanaRegistry(): RegisteredProvider {
  const registered: RegisteredProvider = {
    providerId: "lorcana-dataset",
    gameCode: "LORCANA",
    kind: "catalog",
    capabilities: { ...CATALOG_CAPABILITIES_NO_PRICES, rulings: false },
    mode: (process.env.LORCANA_ROLLOUT_MODE as RegisteredProvider["mode"]) ?? "LIVE",
    canaryPercent: Number(process.env.LORCANA_CANARY_PERCENT ?? 100),
    health: { status: "unknown" },
    statistics: {
      requestsToday: 0,
      requestsTotal: 0,
      syncCardsTotal: 0,
      syncErrorsTotal: 0,
    },
  };
  providerRegistry.register(registered);
  return registered;
}

/**
 * @deprecated Prefer `runScryfallShadowSync` — this entry only validates registry/provider fetch.
 * Domain Events MUST go through Outbox (ADR-004). Direct EventBus publish was removed.
 */
export async function runCatalogSync(opts: {
  gameCode: string;
  providerId: string;
  requestId: string;
  setCode?: string;
  full?: boolean;
}): Promise<{ sets: number; cards: number; mode: string }> {
  const registered = providerRegistry.get(opts.providerId, opts.gameCode);
  if (!registered) {
    throw new Error(`provider_not_registered:${opts.providerId}:${opts.gameCode}`);
  }
  if (!providerRegistry.shouldRun(registered)) {
    log.info({ providerId: opts.providerId, mode: registered.mode }, "sync_skipped");
    return { sets: 0, cards: 0, mode: registered.mode };
  }

  const ctx: SyncContext = {
    requestId: opts.requestId,
    mode: registered.mode,
    full: opts.full,
    flags: {
      enableImages: flagStore.isEnabled("provider", "enable_images", opts.providerId),
      enableVariants: flagStore.isEnabled("provider", "enable_variants", opts.providerId),
      enableLegality: flagStore.isEnabled("provider", "enable_legality", opts.providerId),
      enableRulings: flagStore.isEnabled("provider", "enable_rulings", opts.providerId),
    },
  };

  const provider = createCatalogProvider(opts.gameCode, opts.providerId);
  const started = Date.now();

  try {
    const sets = await provider.syncSets(ctx);
    let cardsCount = 0;

    if (opts.setCode && providerRegistry.supports(opts.providerId, opts.gameCode, "cards")) {
      const cards = await provider.syncCards(ctx, opts.setCode);
      cardsCount = cards.count;
      // Persistence + Outbox: use runScryfallShadowSync (Sprint 2). No EventBus publish here.
      log.info(
        {
          requestId: opts.requestId,
          setCode: opts.setCode,
          cards: cardsCount,
          hint: "runScryfallShadowSync",
        },
        "catalog_sync_fetch_only",
      );
    }

    const durationSec = (Date.now() - started) / 1000;
    metrics.observe("sync_duration_seconds", durationSec, {
      providerId: opts.providerId,
      gameCode: opts.gameCode,
    });
    metrics.inc("sync_cards_total", { providerId: opts.providerId, gameCode: opts.gameCode }, cardsCount);
    providerRegistry.recordSuccess(opts.providerId, opts.gameCode, durationSec * 1000, cardsCount);

    return { sets: sets.count, cards: cardsCount, mode: registered.mode };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    metrics.inc("sync_errors_total", { providerId: opts.providerId, gameCode: opts.gameCode });
    providerRegistry.recordError(opts.providerId, opts.gameCode, message);
    log.error({ err: message, requestId: opts.requestId }, "catalog_sync_failed");
    throw err;
  }
}
