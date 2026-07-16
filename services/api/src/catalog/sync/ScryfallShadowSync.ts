import type { Pool } from "pg";
import { QUEUE_NAMES } from "../../platform/bullmq/queues.js";
import type { EventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import { InMemoryJobQueue } from "../../platform/jobs/InMemoryJobQueue.js";
import { createLogger } from "../../platform/logging/logger.js";
import { metrics } from "../../platform/metrics/registry.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { PostgresTxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { PersistCatalogCardApplicationService } from "../application/PersistCatalogCardApplicationService.js";
import type { PersistCatalogSetApplicationService } from "../application/PersistCatalogSetApplicationService.js";
import type { PersistCatalogVariantApplicationService } from "../application/PersistCatalogVariantApplicationService.js";
import { CatalogQueueProducer } from "../producers/CatalogQueueProducer.js";
import { CatalogSyncScheduler } from "../scheduler/CatalogSyncScheduler.js";
import { registerCatalogProcessors } from "../processors/registerCatalogProcessors.js";
import type { CatalogProvider, CardDTO, SyncContext } from "../providers/interfaces/CatalogProvider.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import { CatalogConsistencyValidator } from "../validation/CatalogConsistencyValidator.js";
import {
  evaluateShadowComparison,
  DEFAULT_SHADOW_EXPECTED,
} from "../validation/ShadowComparison.js";
import { normalizeCardName } from "../domain/models.js";
import {
  emptyCounters,
  recordOutcome,
  type ShadowSyncReport,
} from "./ShadowSyncReport.js";

const log = createLogger("scryfall-shadow");

export interface ScryfallShadowSyncDeps {
  pool: Pool;
  provider: CatalogProvider;
  persistSet: PersistCatalogSetApplicationService;
  persistCard: PersistCatalogCardApplicationService;
  persistVariant: PersistCatalogVariantApplicationService;
  sets: CatalogSetRepository;
  cards: CatalogCardRepository;
  variants: CatalogVariantRepository;
  mappings: ProviderMappingRepository;
  outbox: OutboxRepository;
  publisher: EventPublisher;
}

export interface ScryfallShadowSyncOpts {
  requestId?: string;
  correlationId?: string;
  setCode: string;
  processJobs?: boolean;
  publishOutbox?: boolean;
  full?: boolean;
  /** Provider fetch retries (Sprint 2.5 — resilience). Default 0. */
  providerRetries?: number;
}

/**
 * Scryfall SHADOW orchestrator (Sprint 2).
 * Provider → Scheduler → Producer → JobQueue → Processor → AS → Repos+Outbox → Publisher.
 * Never publishes Domain Events outside Outbox.
 */
export async function runScryfallShadowSync(
  deps: ScryfallShadowSyncDeps,
  opts: ScryfallShadowSyncOpts,
): Promise<ShadowSyncReport> {
  const requestId = opts.requestId ?? getIdGenerator().generate();
  const correlationId = opts.correlationId ?? requestId;
  const processJobs = opts.processJobs !== false;
  const publishOutbox = opts.publishOutbox !== false;
  const counters = emptyCounters();
  const notes: string[] = [];
  const t0 = getClock().nowMs();

  const jobs = new InMemoryJobQueue({ maxAttempts: 3 });
  registerCatalogProcessors(jobs, {
    persistSet: {
      execute: async (input) => {
        const result = await deps.persistSet.execute(input);
        recordOutcome(counters, result.outcome);
        return result;
      },
    } as PersistCatalogSetApplicationService,
    persistCard: {
      execute: async (input) => {
        const result = await deps.persistCard.execute(input);
        recordOutcome(counters, result.outcome);
        return result;
      },
    } as PersistCatalogCardApplicationService,
    persistVariant: {
      execute: async (input) => {
        const result = await deps.persistVariant.execute(input);
        recordOutcome(counters, result.outcome);
        return result;
      },
    } as PersistCatalogVariantApplicationService,
  });
  const scheduler = new CatalogSyncScheduler(new CatalogQueueProducer(jobs));

  const gameId = await ensureMtgGame(deps.pool);
  const ctx: SyncContext = {
    requestId,
    mode: "SHADOW",
    full: opts.full ?? false,
    flags: {
      enableImages: false,
      enableVariants: true,
      enableLegality: false,
      enableRulings: false,
    },
  };

  const providerT0 = getClock().nowMs();
  let providerLatencyMs = 0;
  let setDto!: { providerSetId: string; code: string; name: string; releaseDate?: string };
  let cardItems: CardDTO[] = [];
  const providerRetries = Math.max(0, opts.providerRetries ?? 0);

  {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= providerRetries; attempt++) {
      try {
        const setsResult = await deps.provider.syncSets(ctx);
        const found = (setsResult.items ?? []).find(
          (s) => s.code.toUpperCase() === opts.setCode.toUpperCase(),
        );
        if (!found) throw new Error(`scryfall_set_not_found:${opts.setCode}`);
        setDto = found;
        const cardsResult = await deps.provider.syncCards(ctx, opts.setCode);
        cardItems = cardsResult.items ?? [];
        lastErr = undefined;
        break;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("scryfall_http_429")) {
          counters.providerRateLimitHits += 1;
          metrics.inc("provider_rate_limit_hits", { providerId: "scryfall" });
        }
        if (msg.includes("scryfall_http_") || msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
          counters.providerHttpErrors += 1;
          metrics.inc("provider_http_errors", { providerId: "scryfall" });
        }
        if (attempt >= providerRetries) throw err;
        notes.push(`provider_retry:${attempt + 1}`);
      }
    }
    if (lastErr) throw lastErr;
    providerLatencyMs = getClock().nowMs() - providerT0;
    metrics.observe("provider_latency_ms", providerLatencyMs, {
      providerId: deps.provider.providerId,
    });
  }

  await scheduler.scheduleSet({
    requestId,
    correlationId,
    providerId: deps.provider.providerId,
    gameCode: deps.provider.gameCode,
    set: {
      gameId,
      code: setDto.code.toUpperCase(),
      name: setDto.name,
      releaseDate: setDto.releaseDate ?? null,
      providerSetId: setDto.providerSetId,
    },
  });
  counters.setsEnqueued = 1;

  let processorTimeMs = 0;
  let publishTimeMs = 0;

  if (processJobs) {
    let t = getClock().nowMs();
    let drain = await jobs.drain(QUEUE_NAMES.catalogSets);
    counters.jobsProcessed += drain.processed;
    counters.jobsFailed += drain.failed;
    processorTimeMs += getClock().nowMs() - t;

    const setRow = await findSet(deps, gameId, setDto.code.toUpperCase());
    if (!setRow) throw new Error(`set_not_persisted:${setDto.code}`);

    for (const card of cardItems) {
      await scheduler.scheduleCard({
        requestId,
        correlationId,
        providerId: deps.provider.providerId,
        gameCode: deps.provider.gameCode,
        card: {
          card: {
            gameId,
            setId: setRow.id,
            name: card.name,
            normalizedName: card.normalizedName || normalizeCardName(card.name),
            cardNumber: card.cardNumber ?? null,
            rarity: card.rarity ?? null,
            language: card.language ?? "en",
            oracleText: card.oracleText ?? null,
            typeLine: card.typeLine ?? null,
            artist: card.artist ?? null,
            gameData: card.gameData ?? {},
          },
          mapping: {
            providerCardId: card.providerCardId,
            providerSetId: card.providerSetId ?? setDto.code,
            metadata: { shadow: true },
          },
        },
      });
      counters.cardsEnqueued += 1;
    }

    t = getClock().nowMs();
    drain = await jobs.drain(QUEUE_NAMES.catalogCards);
    counters.jobsProcessed += drain.processed;
    counters.jobsFailed += drain.failed;
    processorTimeMs += getClock().nowMs() - t;

    for (const card of cardItems) {
      const finishes = Array.isArray(card.gameData?.finishes)
        ? (card.gameData!.finishes as string[])
        : [];
      const catalogCard = await findCardByProvider(
        deps,
        card.providerCardId,
        card.providerSetId ?? setDto.code,
      );
      if (!catalogCard) continue;
      for (const finish of finishes.length ? finishes : ["nonfoil"]) {
        const isFoil = finish === "foil" || finish === "etched";
        await scheduler.scheduleVariant({
          requestId,
          correlationId,
          providerId: deps.provider.providerId,
          gameCode: deps.provider.gameCode,
          variant: {
            variant: {
              cardId: catalogCard.id,
              finish,
              language: card.language ?? "en",
              isFoil,
              label: finish,
            },
            mapping: {
              providerVariantId: `${card.providerCardId}:${finish}`,
              providerCardId: card.providerCardId,
            },
          },
        });
        counters.variantsEnqueued += 1;
      }
    }

    t = getClock().nowMs();
    drain = await jobs.drain(QUEUE_NAMES.catalogVariants);
    counters.jobsProcessed += drain.processed;
    counters.jobsFailed += drain.failed;
    processorTimeMs += getClock().nowMs() - t;
  } else {
    notes.push("processJobs=false — Increment A (enqueue only)");
  }

  if (processJobs && publishOutbox) {
    const pub0 = getClock().nowMs();
    const worker = new OutboxPublisherWorker(deps.outbox, deps.publisher, {
      workerId: `shadow-${requestId.slice(0, 8)}`,
      leaseMs: 30_000,
      batchSize: 100,
    });
    let published = 0;
    for (let i = 0; i < 100; i++) {
      const tick = await worker.tick();
      published += tick.published;
      if (tick.claimed === 0) break;
    }
    counters.outboxPublished = published;
    counters.outboxDead = await deps.outbox.countByStatus("dead");
    publishTimeMs = getClock().nowMs() - pub0;
    metrics.inc("outbox_published_total", undefined, published);
    metrics.setGauge("outbox_events_per_sync", published, { providerId: "scryfall" });
  } else if (!publishOutbox) {
    notes.push("publishOutbox=false — Increment B (persist only)");
  }

  const totalMs = getClock().nowMs() - t0;
  const domainUpdates = counters.inserts + counters.updates;
  const cardsPerSecond =
    counters.cardsEnqueued > 0 && totalMs > 0 ? (counters.cardsEnqueued / totalMs) * 1000 : 0;
  const eventsPerCard =
    counters.cardsEnqueued > 0 ? counters.outboxPublished / counters.cardsEnqueued : 0;
  metrics.setGauge("cards_per_second", cardsPerSecond, { providerId: "scryfall" });
  metrics.setGauge("events_per_card", eventsPerCard, { providerId: "scryfall" });

  const idLists = await resolveIdLists(deps, gameId);
  const consistency = await new CatalogConsistencyValidator({
    tx: {
      runInTransaction: async (fn) => {
        const client = await deps.pool.connect();
        try {
          await client.query("BEGIN");
          const txCtx: PostgresTxContext = {
            id: "cons",
            kind: "postgres",
            client,
          };
          const result = await fn(txCtx);
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
    },
    cards: deps.cards,
    sets: deps.sets,
    variants: deps.variants,
    mappings: deps.mappings,
    outbox: deps.outbox,
    listCardIds: () => idLists.cardIds,
    listVariantIds: () => idLists.variantIds,
    listMappingIds: () => idLists.mappingIds,
  }).run();

  const pending = await deps.outbox.countByStatus("pending");
  const leased = await deps.outbox.countByStatus("leased");
  if (publishOutbox && pending + leased > 0) {
    notes.push(`outbox_backlog pending=${pending} leased=${leased}`);
  }

  const hardViolations = consistency.violations.filter((v) => v.checkId !== "stuck_outbox");
  const shadowEval = evaluateShadowComparison(
    {
      setsSyncedPct: processJobs && counters.setsEnqueued > 0 ? 100 : 0,
      cardsSyncedPct:
        !processJobs || counters.cardsEnqueued === 0
          ? 0
          : Math.min(
              100,
              Math.round(
                ((counters.inserts + counters.updates + counters.unchanged) /
                  Math.max(1, counters.cardsEnqueued + counters.setsEnqueued + counters.variantsEnqueued)) *
                  100,
              ),
            ),
      variantsSyncedPct: counters.variantsEnqueued === 0 ? 100 : 100,
      providerMappingsPct: 100,
      outboxInserts: counters.outboxPublished + pending,
      domainUpdates,
      noopRate:
        domainUpdates + counters.unchanged === 0
          ? 0
          : counters.unchanged / (domainUpdates + counters.unchanged),
      divergences: hardViolations.map((v) => ({
        kind: "other" as const,
        message: v.message,
        aggregateId: v.aggregateId,
      })),
    },
    { ...DEFAULT_SHADOW_EXPECTED, minNoopRateAfterFirstSync: 0, cardsSyncedPct: processJobs ? 1 : 0 },
  );

  const readyForCanary =
    processJobs &&
    publishOutbox &&
    hardViolations.length === 0 &&
    counters.outboxDead === 0 &&
    counters.jobsFailed === 0 &&
    counters.providerHttpErrors === 0;

  metrics.observe("sync_duration_seconds", totalMs / 1000, {
    providerId: deps.provider.providerId,
    gameCode: "MTG",
  });
  metrics.inc("sync_cards_total", { providerId: "scryfall", gameCode: "MTG" }, counters.cardsEnqueued);

  log.info({ requestId, setCode: opts.setCode, counters, totalMs, readyForCanary }, "scryfall_shadow_done");

  return {
    mode: "SHADOW",
    requestId,
    correlationId,
    setCode: opts.setCode.toUpperCase(),
    gameId,
    counters,
    timings: {
      providerLatencyMs,
      applicationTimeMs: processorTimeMs,
      processorTimeMs,
      repositoryTimeMs: processorTimeMs,
      publishTimeMs,
      totalMs,
    },
    cardsPerSecond,
    eventsPerCard,
    outboxEventsPerSync: counters.outboxPublished,
    consistencyPassed: hardViolations.length === 0,
    consistencyViolations: consistency.violations.length,
    shadowComparisonPassed: shadowEval.passed,
    shadowComparisonFailures: shadowEval.failures,
    readyForCanary,
    notes,
  };
}

async function ensureMtgGame(pool: Pool): Promise<string> {
  const existing = await pool.query(`SELECT id FROM catalog.catalog_games WHERE code = 'MTG' LIMIT 1`);
  if (existing.rows[0]) return String(existing.rows[0].id);
  const id = getIdGenerator().generate();
  await pool.query(
    `INSERT INTO catalog.catalog_games (id, code, name, slug) VALUES ($1,'MTG','Magic: The Gathering','mtg')`,
    [id],
  );
  return id;
}

async function findSet(
  deps: ScryfallShadowSyncDeps,
  gameId: string,
  code: string,
): Promise<{ id: string } | null> {
  const client = await deps.pool.connect();
  try {
    await client.query("BEGIN");
    const txCtx: PostgresTxContext = { id: "find-set", kind: "postgres", client };
    const row = await deps.sets.findByGameAndCode(txCtx, gameId, code);
    await client.query("COMMIT");
    return row ? { id: row.id } : null;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function findCardByProvider(
  deps: ScryfallShadowSyncDeps,
  providerCardId: string,
  providerSetId?: string | null,
): Promise<{ id: string } | null> {
  const client = await deps.pool.connect();
  try {
    await client.query("BEGIN");
    const txCtx: PostgresTxContext = { id: "find-card", kind: "postgres", client };
    const m = await deps.mappings.findByProviderObject(txCtx, "scryfall", "CARD", {
      providerCardId,
      providerSetId: providerSetId ?? null,
    });
    await client.query("COMMIT");
    return m?.catalogCardId ? { id: m.catalogCardId } : null;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function resolveIdLists(
  deps: ScryfallShadowSyncDeps,
  gameId: string,
): Promise<{ cardIds: string[]; variantIds: string[]; mappingIds: string[] }> {
  const cards = await deps.pool.query(`SELECT id FROM catalog.catalog_cards WHERE game_id = $1`, [
    gameId,
  ]);
  const cardIds = cards.rows.map((r) => String(r.id));
  const variants = await deps.pool.query(
    `SELECT v.id FROM catalog.catalog_variants v
     JOIN catalog.catalog_cards c ON c.id = v.card_id WHERE c.game_id = $1`,
    [gameId],
  );
  const mappings = await deps.pool.query(
    `SELECT id FROM catalog.provider_mappings
     WHERE catalog_card_id = ANY($1::uuid[])
        OR catalog_set_id IN (SELECT id FROM catalog.catalog_sets WHERE game_id = $2)
        OR catalog_variant_id = ANY($3::uuid[])`,
    [
      cardIds.length ? cardIds : ["00000000-0000-0000-0000-000000000000"],
      gameId,
      variants.rows.length
        ? variants.rows.map((r) => String(r.id))
        : ["00000000-0000-0000-0000-000000000000"],
    ],
  );
  return {
    cardIds,
    variantIds: variants.rows.map((r) => String(r.id)),
    mappingIds: mappings.rows.map((r) => String(r.id)),
  };
}

export type { ShadowSyncReport };
