import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { InMemoryEventPublisher } from "../../../platform/event-publisher/EventPublisher.js";
import { createPostgresCatalogStack } from "../../persistence/createPostgresCatalogStack.js";
import type { CatalogProvider, SyncContext, SyncResult, SetDTO, CardDTO } from "../../providers/interfaces/CatalogProvider.js";
import { CATALOG_CAPABILITIES_NO_PRICES } from "../../registry/ProviderRegistry.js";
import { runScryfallShadowSync } from "../ScryfallShadowSync.js";

const databaseUrl =
  process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

class FakeScryfall implements CatalogProvider {
  readonly providerId = "scryfall";
  readonly gameCode = "MTG";
  readonly capabilities = { ...CATALOG_CAPABILITIES_NO_PRICES };

  async syncSets(_ctx: SyncContext): Promise<SyncResult<SetDTO>> {
    return {
      ok: true,
      count: 1,
      items: [{ providerSetId: "set-1", code: "TST", name: "Test Set", releaseDate: "2020-01-01" }],
    };
  }

  async syncCards(_ctx: SyncContext, _set: string): Promise<SyncResult<CardDTO>> {
    return {
      ok: true,
      count: 2,
      items: [
        {
          providerCardId: "c1",
          providerSetId: "tst",
          name: "Alpha Bolt",
          normalizedName: "alpha bolt",
          cardNumber: "1",
          gameData: { finishes: ["nonfoil", "foil"] },
        },
        {
          providerCardId: "c2",
          providerSetId: "tst",
          name: "Beta Counter",
          normalizedName: "beta counter",
          cardNumber: "2",
          gameData: { finishes: ["nonfoil"] },
        },
      ],
    };
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

describe.skipIf(!databaseUrl)("Scryfall SHADOW sync (fake provider + PG)", () => {
  it(
    "persists via AS+Outbox and publishes after commit",
    async () => {
      const pool = new Pool({ connectionString: databaseUrl });
      const stack = createPostgresCatalogStack(pool);
      const publisher = new InMemoryEventPublisher();

      async function cleanupTst(): Promise<void> {
        await pool.query(`DELETE FROM platform.outbox_events WHERE correlation_id = 'shadow-test-1'`);
        const game = await pool.query(`SELECT id FROM catalog.catalog_games WHERE code='MTG'`);
        if (!game.rows[0]) return;
        const gid = game.rows[0].id;
        const setRow = await pool.query(
          `SELECT id FROM catalog.catalog_sets WHERE game_id=$1 AND code='TST'`,
          [gid],
        );
        if (!setRow.rows[0]) return;
        const sid = setRow.rows[0].id;
        await pool.query(
          `DELETE FROM catalog.provider_mappings WHERE catalog_set_id=$1
             OR catalog_card_id IN (SELECT id FROM catalog.catalog_cards WHERE set_id=$1)
             OR catalog_variant_id IN (
               SELECT v.id FROM catalog.catalog_variants v
               JOIN catalog.catalog_cards c ON c.id=v.card_id WHERE c.set_id=$1
             )`,
          [sid],
        );
        await pool.query(
          `DELETE FROM catalog.catalog_variants WHERE card_id IN (SELECT id FROM catalog.catalog_cards WHERE set_id=$1)`,
          [sid],
        );
        await pool.query(`DELETE FROM catalog.catalog_cards WHERE set_id=$1`, [sid]);
        await pool.query(`DELETE FROM catalog.catalog_sets WHERE id=$1`, [sid]);
      }

      try {
        await cleanupTst();

        const report = await runScryfallShadowSync(
          {
            pool,
            provider: new FakeScryfall(),
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
          { setCode: "TST", requestId: "shadow-test-1" },
        );

        expect(report.counters.setsEnqueued).toBe(1);
        expect(report.counters.cardsEnqueued).toBe(2);
        expect(report.counters.jobsFailed).toBe(0);
        expect(report.counters.inserts).toBeGreaterThan(0);
        expect(report.counters.outboxPublished).toBeGreaterThan(0);
        expect(publisher.published.length).toBe(report.counters.outboxPublished);
        expect(report.consistencyPassed).toBe(true);
        expect(report.mode).toBe("SHADOW");

        await cleanupTst();
      } finally {
        await pool.end();
      }
    },
    60_000,
  );
});
