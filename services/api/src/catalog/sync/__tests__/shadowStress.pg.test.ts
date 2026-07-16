/**
 * Sprint 2.5 — SHADOW stress (no new product features).
 * Scenarios: idempotency, multi-set, lease reclaim, publisher outage,
 * provider timeout retry, concurrent sync.
 */
import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import {
  InMemoryEventPublisher,
  type EventPublisher,
} from "../../../platform/event-publisher/EventPublisher.js";
import { OutboxPublisherWorker } from "../../../platform/outbox/OutboxPublisherWorker.js";
import { createDomainEvent } from "../../../shared/events/types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { createPostgresCatalogStack } from "../../persistence/createPostgresCatalogStack.js";
import type {
  CatalogProvider,
  SyncContext,
  SyncResult,
  SetDTO,
  CardDTO,
} from "../../providers/interfaces/CatalogProvider.js";
import { CATALOG_CAPABILITIES_NO_PRICES } from "../../registry/ProviderRegistry.js";
import { runScryfallShadowSync } from "../ScryfallShadowSync.js";

const databaseUrl =
  process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

class StressProvider implements CatalogProvider {
  readonly providerId = "scryfall";
  readonly gameCode = "MTG";
  readonly capabilities = { ...CATALOG_CAPABILITIES_NO_PRICES };
  failSetsLeft = 0;
  mutateCardName: string | null = null;

  constructor(
    private readonly sets: SetDTO[],
    private readonly cardsBySet: Record<string, CardDTO[]>,
  ) {}

  async syncSets(_ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    if (this.failSetsLeft > 0) {
      this.failSetsLeft -= 1;
      throw new Error("scryfall_http_504:timeout");
    }
    return { ok: true, count: this.sets.length, items: this.sets };
  }

  async syncCards(_ctx: SyncContext, setCode: string): Promise<SyncResult<CardDTO>> {
    const items = (this.cardsBySet[setCode.toLowerCase()] ?? []).map((c) => ({
      ...c,
      name: this.mutateCardName && c.providerCardId === "s1c1" ? this.mutateCardName : c.name,
      normalizedName:
        this.mutateCardName && c.providerCardId === "s1c1"
          ? this.mutateCardName.toLowerCase()
          : c.normalizedName,
    }));
    return { ok: true, count: items.length, items };
  }

  async syncVariants(): Promise<SyncResult> {
    return { ok: true, count: 0, items: [] };
  }
  async syncImages(): Promise<SyncResult> {
    return { ok: true, count: 0, items: [] };
  }
  async syncLegality(): Promise<SyncResult> {
    return { ok: true, count: 0, items: [] };
  }
  async syncRulings(): Promise<SyncResult> {
    return { ok: true, count: 0, items: [] };
  }
}

/** Publisher that simulates Redis down until recover() is called. */
class OutagePublisher implements EventPublisher {
  down = true;
  readonly published: unknown[] = [];

  async publish(event: { id?: string }): Promise<void> {
    if (this.down) throw new Error("redis_unavailable");
    this.published.push(event);
  }

  recover(): void {
    this.down = false;
  }
}

function baseProvider(): StressProvider {
  return new StressProvider(
    [
      { providerSetId: "set-s1", code: "S1", name: "Stress One", releaseDate: "2020-01-01" },
      { providerSetId: "set-s2", code: "S2", name: "Stress Two", releaseDate: "2020-02-01" },
    ],
    {
      s1: [
        {
          providerCardId: "s1c1",
          providerSetId: "s1",
          name: "Alpha",
          normalizedName: "alpha",
          cardNumber: "1",
          gameData: { finishes: ["nonfoil"] },
        },
        {
          providerCardId: "s1c2",
          providerSetId: "s1",
          name: "Beta",
          normalizedName: "beta",
          cardNumber: "2",
          gameData: { finishes: ["nonfoil", "foil"] },
        },
      ],
      s2: [
        {
          providerCardId: "s2c1",
          providerSetId: "s2",
          name: "Gamma",
          normalizedName: "gamma",
          cardNumber: "1",
          gameData: { finishes: ["nonfoil"] },
        },
      ],
    },
  );
}

async function cleanupStress(pool: Pool): Promise<void> {
  const game = await pool.query(`SELECT id FROM catalog.catalog_games WHERE code='MTG'`);
  if (!game.rows[0]) return;
  const gid = game.rows[0].id as string;
  const setIds = await pool.query(
    `SELECT id FROM catalog.catalog_sets WHERE game_id=$1 AND code IN ('S1','S2')`,
    [gid],
  );
  const ids = setIds.rows.map((r) => r.id as string);
  if (ids.length === 0) return;

  await pool.query(
    `DELETE FROM platform.outbox_events WHERE correlation_id LIKE 'stress-%'
       OR aggregate_id IN (
         SELECT id::text FROM catalog.catalog_cards WHERE set_id = ANY($1::uuid[])
         UNION SELECT id::text FROM catalog.catalog_sets WHERE id = ANY($1::uuid[])
         UNION SELECT v.id::text FROM catalog.catalog_variants v
           JOIN catalog.catalog_cards c ON c.id=v.card_id WHERE c.set_id = ANY($1::uuid[])
       )`,
    [ids],
  );
  await pool.query(
    `DELETE FROM catalog.provider_mappings WHERE catalog_set_id = ANY($1::uuid[])
       OR catalog_card_id IN (SELECT id FROM catalog.catalog_cards WHERE set_id = ANY($1::uuid[]))
       OR catalog_variant_id IN (
         SELECT v.id FROM catalog.catalog_variants v
         JOIN catalog.catalog_cards c ON c.id=v.card_id WHERE c.set_id = ANY($1::uuid[])
       )`,
    [ids],
  );
  await pool.query(
    `DELETE FROM catalog.catalog_variants WHERE card_id IN (SELECT id FROM catalog.catalog_cards WHERE set_id = ANY($1::uuid[]))`,
    [ids],
  );
  await pool.query(`DELETE FROM catalog.catalog_cards WHERE set_id = ANY($1::uuid[])`, [ids]);
  await pool.query(`DELETE FROM catalog.catalog_sets WHERE id = ANY($1::uuid[])`, [ids]);
}

describe.skipIf(!databaseUrl)("Sprint 2.5 — SHADOW stress", () => {
  it("C1 idempotency: first creates, re-runs unchanged, mutate → updates", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);
    const publisher = new InMemoryEventPublisher();
    const provider = baseProvider();

    try {
      await cleanupStress(pool);

      const first = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c1-1" },
      );
      // 1 set + 2 cards + 3 variants
      expect(first.counters.inserts).toBe(6);
      expect(first.counters.unchanged).toBe(0);
      expect(first.counters.jobsFailed).toBe(0);
      expect(first.counters.outboxDead).toBe(0);
      expect(first.consistencyPassed).toBe(true);

      const cardCountAfterFirst = await pool.query(
        `SELECT COUNT(*)::int AS n FROM catalog.catalog_cards c
         JOIN catalog.catalog_sets s ON s.id=c.set_id WHERE s.code='S1'`,
      );
      expect(cardCountAfterFirst.rows[0].n).toBe(2);

      for (let i = 2; i <= 5; i++) {
        const again = await runScryfallShadowSync(
          {
            pool,
            provider,
            persistSet: stack.apps.persistSet,
            persistCard: stack.apps.persistCard,
            persistVariant: stack.apps.persistVariant,
            sets: stack.sets,
            cards: stack.cards,
            variants: stack.variants,
            mappings: stack.mappings,
            outbox: stack.outbox,
            publisher,
          },
          { setCode: "S1", requestId: `stress-c1-${i}` },
        );
        expect(again.counters.inserts).toBe(0);
        expect(again.counters.updates).toBe(0);
        expect(again.counters.unchanged).toBe(6);
        expect(again.counters.outboxPublished).toBe(0);
        expect(again.counters.jobsFailed).toBe(0);
        expect(again.consistencyPassed).toBe(true);
      }

      const cardCountAfterRerun = await pool.query(
        `SELECT COUNT(*)::int AS n FROM catalog.catalog_cards c
         JOIN catalog.catalog_sets s ON s.id=c.set_id WHERE s.code='S1'`,
      );
      expect(cardCountAfterRerun.rows[0].n).toBe(2);

      provider.mutateCardName = "Alpha Renamed";
      const updated = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c1-mutate" },
      );
      expect(updated.counters.inserts).toBe(0);
      expect(updated.counters.updates).toBeGreaterThanOrEqual(1);
      expect(updated.counters.unchanged).toBeGreaterThanOrEqual(4);
      expect(updated.consistencyPassed).toBe(true);
    } finally {
      await cleanupStress(pool);
      await pool.end();
    }
  }, 120_000);

  it("C2 multi-set: FKs valid, no cross-set duplication", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);
    const publisher = new InMemoryEventPublisher();
    const provider = baseProvider();

    try {
      await cleanupStress(pool);

      const r1 = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c2-s1" },
      );
      const r2 = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S2", requestId: "stress-c2-s2" },
      );

      expect(r1.consistencyPassed).toBe(true);
      expect(r2.consistencyPassed).toBe(true);
      expect(r1.counters.inserts).toBe(6);
      expect(r2.counters.inserts).toBe(3); // 1 set + 1 card + 1 variant

      const counts = await pool.query(
        `SELECT s.code, COUNT(c.id)::int AS cards
         FROM catalog.catalog_sets s
         LEFT JOIN catalog.catalog_cards c ON c.set_id = s.id
         WHERE s.code IN ('S1','S2')
         GROUP BY s.code
         ORDER BY s.code`,
      );
      expect(counts.rows).toEqual([
        { code: "S1", cards: 2 },
        { code: "S2", cards: 1 },
      ]);

      const orphans = await pool.query(
        `SELECT COUNT(*)::int AS n FROM catalog.catalog_cards WHERE set_id IS NULL OR set_id NOT IN (SELECT id FROM catalog.catalog_sets)`,
      );
      expect(orphans.rows[0].n).toBe(0);
    } finally {
      await cleanupStress(pool);
      await pool.end();
    }
  }, 120_000);

  it("C3 lease expire: another worker reclaims; no lost event", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);

    try {
      const event = createDomainEvent(
        "CardUpdated",
        getIdGenerator().generate(),
        { stress: true },
        {
          aggregateType: "catalog_card",
          id: getIdGenerator().generate(),
          requestId: "stress-c3",
          correlationId: "stress-c3",
          producer: "shadow-stress",
        },
      );

      await stack.tx.runInTransaction(async (tx) => {
        await stack.outbox.insert(tx, { event });
      });

      const now = new Date();
      const claimed = await stack.outbox.claimBatch({
        workerId: "worker-crash",
        leaseMs: 50,
        limit: 1,
        now,
      });
      expect(claimed).toHaveLength(1);

      const mid = await stack.outbox.claimBatch({
        workerId: "worker-alive",
        leaseMs: 5_000,
        limit: 1,
        now: new Date(now.getTime() + 10),
      });
      expect(mid).toHaveLength(0);

      await new Promise((r) => setTimeout(r, 80));

      const recovered = await stack.outbox.claimBatch({
        workerId: "worker-alive",
        leaseMs: 5_000,
        limit: 1,
        now: new Date(now.getTime() + 200),
      });
      expect(recovered).toHaveLength(1);
      expect(recovered[0]!.leasedBy).toBe("worker-alive");
      expect(recovered[0]!.id).toBe(claimed[0]!.id);

      await stack.outbox.markPublished(recovered[0]!.id);
      const pending = await stack.outbox.countByStatus("pending");
      const dead = await stack.outbox.countByStatus("dead");
      expect(dead).toBe(0);
      // leftover pending from other tests may exist; this event must be published
      const row = await pool.query(`SELECT status FROM platform.outbox_events WHERE id=$1`, [
        recovered[0]!.id,
      ]);
      expect(row.rows[0].status).toBe("published");
      void pending;
    } finally {
      await pool.query(`DELETE FROM platform.outbox_events WHERE correlation_id='stress-c3'`);
      await pool.end();
    }
  }, 30_000);

  it("C4 publisher outage: outbox accumulates then drains; dead=0", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);
    const publisher = new OutagePublisher();
    const provider = baseProvider();

    try {
      await cleanupStress(pool);

      // Persist + outbox INSERT without publish (Redis down).
      const report = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c4", publishOutbox: false },
      );
      expect(report.counters.inserts).toBe(6);
      expect(await stack.outbox.countByStatus("pending")).toBeGreaterThan(0);

      // Publisher still down — one failed attempt, stays pending (not dead).
      const failWorker = new OutboxPublisherWorker(stack.outbox, publisher, {
        workerId: "stress-c4-fail",
        leaseMs: 30_000,
        batchSize: 50,
      });
      const failTick = await failWorker.tick();
      expect(failTick.published).toBe(0);
      expect(failTick.dead).toBe(0);
      expect(await stack.outbox.countByStatus("dead")).toBe(0);

      // Wait for next_retry_at backoff (1s after first failure).
      await new Promise((r) => setTimeout(r, 1_200));

      publisher.recover();
      const worker = new OutboxPublisherWorker(stack.outbox, publisher, {
        workerId: "stress-c4-recover",
        leaseMs: 30_000,
        batchSize: 50,
      });
      let published = 0;
      for (let i = 0; i < 50; i++) {
        const tick = await worker.tick();
        published += tick.published;
        if (tick.claimed === 0) break;
      }
      expect(published).toBeGreaterThan(0);
      expect(await stack.outbox.countByStatus("dead")).toBe(0);
      expect(await stack.outbox.countByStatus("pending")).toBe(0);
    } finally {
      await cleanupStress(pool);
      await pool.end();
    }
  }, 120_000);

  it("C5 provider timeout: retries then succeeds; dead=0", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);
    const publisher = new InMemoryEventPublisher();
    const provider = baseProvider();
    provider.failSetsLeft = 2;

    try {
      await cleanupStress(pool);

      const report = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c5", providerRetries: 3 },
      );

      expect(report.counters.providerHttpErrors).toBe(2);
      expect(report.counters.inserts).toBe(6);
      expect(report.counters.outboxDead).toBe(0);
      expect(report.notes.some((n) => n.startsWith("provider_retry:"))).toBe(true);
      expect(report.consistencyPassed).toBe(true);
    } finally {
      await cleanupStress(pool);
      await pool.end();
    }
  }, 120_000);

  it("C6 concurrent sync same set: no duplication, consistency ok", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const stack = createPostgresCatalogStack(pool);
    const publisher = new InMemoryEventPublisher();
    const provider = baseProvider();

    try {
      await cleanupStress(pool);

      // Seed once so identity mappings exist (avoids first-create race on unique mapping).
      await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        { setCode: "S1", requestId: "stress-c6-seed" },
      );

      const [a, b] = await Promise.all([
        runScryfallShadowSync(
          {
            pool,
            provider,
            persistSet: stack.apps.persistSet,
            persistCard: stack.apps.persistCard,
            persistVariant: stack.apps.persistVariant,
            sets: stack.sets,
            cards: stack.cards,
            variants: stack.variants,
            mappings: stack.mappings,
            outbox: stack.outbox,
            publisher: new InMemoryEventPublisher(),
          },
          { setCode: "S1", requestId: "stress-c6-a" },
        ),
        runScryfallShadowSync(
          {
            pool,
            provider,
            persistSet: stack.apps.persistSet,
            persistCard: stack.apps.persistCard,
            persistVariant: stack.apps.persistVariant,
            sets: stack.sets,
            cards: stack.cards,
            variants: stack.variants,
            mappings: stack.mappings,
            outbox: stack.outbox,
            publisher: new InMemoryEventPublisher(),
          },
          { setCode: "S1", requestId: "stress-c6-b" },
        ),
      ]);

      expect(a.counters.inserts + b.counters.inserts).toBe(0);
      expect(a.counters.jobsFailed + b.counters.jobsFailed).toBe(0);
      expect(a.consistencyPassed).toBe(true);
      expect(b.consistencyPassed).toBe(true);

      const cards = await pool.query(
        `SELECT COUNT(*)::int AS n FROM catalog.catalog_cards c
         JOIN catalog.catalog_sets s ON s.id=c.set_id WHERE s.code='S1'`,
      );
      expect(cards.rows[0].n).toBe(2);
    } finally {
      await cleanupStress(pool);
      await pool.end();
    }
  }, 120_000);
});
