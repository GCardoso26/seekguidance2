import { describe, expect, it } from "vitest";
import { createDomainEvent } from "../../../shared/events/types.js";
import {
  evaluateShadowComparison,
  DEFAULT_SHADOW_EXPECTED,
} from "../ShadowComparison.js";
import { CatalogConsistencyValidator } from "../CatalogConsistencyValidator.js";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryCatalogCardRepository } from "../../persistence/InMemoryCatalogCardRepository.js";
import { InMemoryCatalogSetRepository } from "../../persistence/InMemoryCatalogSetRepository.js";
import { InMemoryCatalogVariantRepository } from "../../persistence/InMemoryCatalogVariantRepository.js";
import { InMemoryProviderMappingRepository } from "../../persistence/InMemoryProviderMappingRepository.js";
import { InMemoryOutboxRepository } from "../../../platform/outbox/InMemoryOutboxRepository.js";

describe("ShadowComparison", () => {
  it("passes when metrics meet defaults", () => {
    const result = evaluateShadowComparison({
      setsSyncedPct: 100,
      cardsSyncedPct: 100,
      variantsSyncedPct: 100,
      providerMappingsPct: 100,
      outboxInserts: 10,
      domainUpdates: 10,
      noopRate: 0.98,
      divergences: [],
    });
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails on divergence and outbox mismatch", () => {
    const result = evaluateShadowComparison(
      {
        setsSyncedPct: 100,
        cardsSyncedPct: 90,
        variantsSyncedPct: 100,
        providerMappingsPct: 100,
        outboxInserts: 5,
        domainUpdates: 8,
        noopRate: 0.5,
        divergences: [{ kind: "missing_card", message: "card X" }],
      },
      DEFAULT_SHADOW_EXPECTED,
    );
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});

describe("CatalogConsistencyValidator", () => {
  it("flags card without set and stuck outbox", async () => {
    const cards = new InMemoryCatalogCardRepository();
    const sets = new InMemoryCatalogSetRepository();
    const variants = new InMemoryCatalogVariantRepository();
    const mappings = new InMemoryProviderMappingRepository();
    const outbox = new InMemoryOutboxRepository();
    const tx = new InMemoryTransactionManager([cards, sets, variants, mappings, outbox]);
    const gameId = crypto.randomUUID();

    await tx.runInTransaction(async (ctx) => {
      await cards.upsert(ctx, {
        gameId,
        name: "Orphan Card",
        normalizedName: "orphan card",
      });
      await outbox.insert(ctx, {
        event: createDomainEvent(
          "CardUpdated",
          "x",
          {},
          { requestId: "r", correlationId: "r", aggregateType: "catalog_card" },
        ),
      });
    });

    const validator = new CatalogConsistencyValidator({
      tx,
      cards,
      sets,
      variants,
      mappings,
      outbox,
      listCardIds: () => cards.allIds(),
      listVariantIds: () => variants.allIds(),
      listMappingIds: () => mappings.allIds(),
    });

    const report = await validator.run();
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.checkId === "card_without_set")).toBe(true);
    expect(report.violations.some((v) => v.checkId === "stuck_outbox")).toBe(true);
  });
});
