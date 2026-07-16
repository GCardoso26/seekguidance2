import { describe, expect, it, beforeEach } from "vitest";
import { createDomainEvent } from "../../../shared/events/types.js";
import { PersistCatalogCardApplicationService } from "../../../catalog/application/PersistCatalogCardApplicationService.js";
import { InMemoryCatalogCardRepository } from "../../../catalog/persistence/InMemoryCatalogCardRepository.js";
import { InMemoryCatalogSetRepository } from "../../../catalog/persistence/InMemoryCatalogSetRepository.js";
import { InMemoryProviderMappingRepository } from "../../../catalog/persistence/InMemoryProviderMappingRepository.js";
import { InMemoryOutboxRepository } from "../../outbox/InMemoryOutboxRepository.js";
import { InMemoryTransactionManager } from "../InMemoryTransactionManager.js";
import type { TransactionManager } from "../types.js";

describe("TransactionManager + Repository ports", () => {
  let cards: InMemoryCatalogCardRepository;
  let sets: InMemoryCatalogSetRepository;
  let mappings: InMemoryProviderMappingRepository;
  let outbox: InMemoryOutboxRepository;
  let tx: InMemoryTransactionManager;
  let app: PersistCatalogCardApplicationService;

  beforeEach(() => {
    cards = new InMemoryCatalogCardRepository();
    sets = new InMemoryCatalogSetRepository();
    mappings = new InMemoryProviderMappingRepository();
    outbox = new InMemoryOutboxRepository();
    tx = new InMemoryTransactionManager([sets, cards, mappings, outbox]);
    app = new PersistCatalogCardApplicationService(tx, cards, mappings, outbox);
  });

  it("TransactionManager type surface has no Outbox dependency", () => {
    const only: keyof TransactionManager = "runInTransaction";
    expect(only).toBe("runInTransaction");
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(tx))).not.toContain("insertOutbox");
  });

  it("Application Service commits card + mapping + outbox together", async () => {
    const gameId = crypto.randomUUID();
    await tx.runInTransaction(async (txCtx) => {
      await sets.upsert(txCtx, { gameId, code: "LEA", name: "Limited Edition Alpha" });
    });
    const set = await sets.findByGameAndCode({ id: "r", kind: "memory" }, gameId, "LEA");

    const card = await app.execute({
      requestId: "req-1",
      provider: "scryfall",
      card: {
        gameId,
        setId: set!.id,
        name: "Lightning Bolt",
        normalizedName: "lightning bolt",
        cardNumber: "161",
      },
      mapping: {
        providerCardId: "sf-bolt",
        providerSetId: "lea",
      },
    });

    expect(card.entity.name).toBe("Lightning Bolt");
    const found = await cards.findById({ id: "read", kind: "memory" }, card.entity.id);
    expect(found?.id).toBe(card.entity.id);
    expect(await outbox.countByStatus("pending")).toBe(1);
    const mapping = await mappings.findByProviderObject(
      { id: "read", kind: "memory" },
      "scryfall",
      "CARD",
      { providerCardId: "sf-bolt", providerSetId: "lea" },
    );
    expect(mapping?.catalogCardId).toBe(card.entity.id);
  });

  it("rollback discards card and outbox when Application throws", async () => {
    const gameId = crypto.randomUUID();
    const failingTx = new InMemoryTransactionManager([sets, cards, mappings, outbox]);

    await expect(
      failingTx.runInTransaction(async (txCtx) => {
        await sets.upsert(txCtx, { gameId, code: "LEA", name: "Alpha" });
        const cardResult = await cards.upsert(txCtx, {
          gameId,
          name: "Bolt",
          normalizedName: "bolt",
        });
        await outbox.insert(txCtx, {
          event: createDomainEvent(
            "CardUpdated",
            cardResult.entity.id,
            {},
            { aggregateType: "catalog_card", requestId: "r", correlationId: "r" },
          ),
        });
        throw new Error("simulated_failure");
      }),
    ).rejects.toThrow("simulated_failure");

    expect(
      await cards.findByGameAndNormalizedName({ id: "r", kind: "memory" }, gameId, "bolt"),
    ).toHaveLength(0);
    expect(await outbox.countByStatus("pending")).toBe(0);
    expect(await sets.findByGameAndCode({ id: "r", kind: "memory" }, gameId, "LEA")).toBeNull();
  });

  it("unchanged upsert does not insert Outbox event", async () => {
    const gameId = crypto.randomUUID();
    const cardInput = {
      requestId: "req-noop",
      provider: "scryfall",
      card: {
        gameId,
        name: "Lightning Bolt",
        normalizedName: "lightning bolt",
        cardNumber: "161",
      },
      mapping: {
        providerCardId: "sf-bolt",
        providerSetId: "lea",
      },
    };
    await app.execute(cardInput);
    expect(await outbox.countByStatus("pending")).toBe(1);

    await app.execute({ ...cardInput, requestId: "req-noop-2" });
    expect(await outbox.countByStatus("pending")).toBe(1);
  });

  it("repositories require TxContext (no connection ownership)", async () => {
    const gameId = crypto.randomUUID();
    await tx.runInTransaction(async (txCtx) => {
      expect(txCtx.kind).toBe("memory");
      await cards.upsert(txCtx, {
        gameId,
        name: "Island",
        normalizedName: "island",
      });
    });
  });
});
