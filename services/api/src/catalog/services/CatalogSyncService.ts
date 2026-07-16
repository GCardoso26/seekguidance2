import { createDomainEvent } from "../../shared/events/types.js";
import { eventBus } from "../../platform/event-bus/EventBus.js";
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

/**
 * Phase 1 orchestrator: sync sets (and optionally sample cards) for one game.
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

      for (const card of cards.items ?? []) {
        await eventBus.publish(
          createDomainEvent(
            "CardUpdated",
            card.providerCardId,
            {
              gameCode: opts.gameCode,
              providerId: opts.providerId,
              name: card.name,
              shadow: registered.mode === "SHADOW",
            },
            { requestId: opts.requestId },
          ),
        );
      }
    }

    const durationSec = (Date.now() - started) / 1000;
    metrics.observe("sync_duration_seconds", durationSec, {
      providerId: opts.providerId,
      gameCode: opts.gameCode,
    });
    metrics.inc("sync_cards_total", { providerId: opts.providerId, gameCode: opts.gameCode }, cardsCount);
    providerRegistry.recordSuccess(opts.providerId, opts.gameCode, durationSec * 1000, cardsCount);

    log.info(
      {
        requestId: opts.requestId,
        providerId: opts.providerId,
        gameCode: opts.gameCode,
        sets: sets.count,
        cards: cardsCount,
        mode: registered.mode,
      },
      "catalog_sync_ok",
    );

    return { sets: sets.count, cards: cardsCount, mode: registered.mode };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    metrics.inc("sync_errors_total", { providerId: opts.providerId, gameCode: opts.gameCode });
    providerRegistry.recordError(opts.providerId, opts.gameCode, message);
    log.error({ err: message, requestId: opts.requestId }, "catalog_sync_failed");
    throw err;
  }
}
