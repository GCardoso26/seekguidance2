import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { MarketplaceContractFactory } from "./types.js";
import { inTx, seedSeller } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

/** ListingRepository contract — references Catalog IDs; upsert keyed by id. */
export function registerListingRepositoryContract(factory: MarketplaceContractFactory): void {
  describe("ListingRepository contract", () => {
    let h: Awaited<ReturnType<MarketplaceContractFactory>>;
    let sellerId: string;

    beforeAll(async () => {
      h = await factory();
      sellerId = await seedSeller(h, "lst");
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    function base() {
      return {
        sellerId,
        catalogCardId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        condition: "NM",
        language: "en",
      };
    }

    it("Insert / Update / No-op", async () => {
      const b = base();
      const created = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, priceCents: 1990, quantity: 2, status: "active" }),
      );
      expect(created.outcome).toBe("created");
      const id = created.entity.id;

      const updated = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, {
          ...b,
          id,
          priceCents: 2500,
          quantity: 2,
          status: "active",
          expectedVersion: 1,
        }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.entity.priceCents).toBe(2500);

      const noop = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, id, priceCents: 2500, quantity: 2, status: "active" }),
      );
      expect(noop.outcome).toBe("unchanged");
    });

    it("Concurrency conflict", async () => {
      const b = base();
      const created = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, priceCents: 100, quantity: 1, status: "active" }),
      );
      await expect(
        inTx(h.tx, (tx) =>
          h.listings.upsert(tx, {
            ...b,
            id: created.entity.id,
            priceCents: 200,
            quantity: 1,
            status: "active",
            expectedVersion: 99,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards listing", async () => {
      const b = base();
      const id = getIdGenerator().generate();
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.listings.upsert(tx, {
            ...b,
            id,
            priceCents: 500,
            quantity: 1,
            status: "active",
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.listings.findById(tx, id));
      expect(found).toBeNull();
    });

    it("Idempotent retry (same id)", async () => {
      const b = base();
      const id = getIdGenerator().generate();
      const first = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, id, priceCents: 700, quantity: 1, status: "active" }),
      );
      const second = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, id, priceCents: 700, quantity: 1, status: "active" }),
      );
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });

    it("references Catalog IDs only (never official fields)", async () => {
      const b = base();
      const created = await inTx(h.tx, (tx) =>
        h.listings.upsert(tx, { ...b, priceCents: 1000, quantity: 1, status: "active" }),
      );
      expect(created.entity.catalogCardId).toBe(b.catalogCardId);
      expect(created.entity).not.toHaveProperty("name");
      expect(created.entity).not.toHaveProperty("oracleText");
      expect(created.entity).not.toHaveProperty("artist");
    });
  });
}
