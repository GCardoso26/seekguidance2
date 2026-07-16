/**
 * Sprint 5.3 — Reservation Engine concurrent PG tests.
 * Requires real Postgres (advisory locks across connections).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { createPostgresOrderStack } from "../../createPostgresOrderStack.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

const databaseUrl = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

describe.skipIf(!databaseUrl)("Sprint 5.3 — reservationEngine.concurrent.pg", () => {
  let pool: Pool;
  let stack: ReturnType<typeof createPostgresOrderStack>;

  beforeAll(() => {
    pool = new Pool({ connectionString: databaseUrl, max: 8 });
    stack = createPostgresOrderStack(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("C1 — estoque=1: two concurrent buyers → one HELD, one OUT_OF_STOCK", async () => {
    const inventoryItemId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();
    const buyerA = getIdGenerator().generate();
    const buyerB = getIdGenerator().generate();

    const [a, b] = await Promise.all([
      stack.holdReservation.execute({
        requestId: `c1-a-${inventoryItemId}`,
        listingId,
        inventoryItemId,
        buyerId: buyerA,
        quantity: 1,
        availableQuantity: 1,
      }),
      stack.holdReservation.execute({
        requestId: `c1-b-${inventoryItemId}`,
        listingId,
        inventoryItemId,
        buyerId: buyerB,
        quantity: 1,
        availableQuantity: 1,
      }),
    ]);

    const held = [a, b].filter((r) => r.outcome === "held");
    const rejected = [a, b].filter((r) => r.outcome === "rejected");
    expect(held).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    if (rejected[0]!.outcome === "rejected") {
      expect(rejected[0]!.reason).toBe("OUT_OF_STOCK");
    }

    const reserved = await stack.tx.runInTransaction((t) =>
      stack.reservations.reservedQuantityForInventory(t, inventoryItemId),
    );
    expect(reserved).toBe(1);
  });

  it("C2 — retry idempotente: same requestId → 1 HELD", async () => {
    const inventoryItemId = getIdGenerator().generate();
    const requestId = `c2-${inventoryItemId}`;
    const input = {
      requestId,
      listingId: getIdGenerator().generate(),
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    };

    const [a, b] = await Promise.all([
      stack.holdReservation.execute(input),
      stack.holdReservation.execute(input),
    ]);

    expect(a.outcome).toBe("held");
    expect(b.outcome).toBe("held");
    if (a.outcome === "held" && b.outcome === "held") {
      expect(a.reservation.id).toBe(b.reservation.id);
    }
    expect(
      await stack.tx.runInTransaction((t) =>
        stack.reservations.heldQuantityForInventory(t, inventoryItemId),
      ),
    ).toBe(1);
  });

  it("C3 — ExpireReservations on past-due HELD", async () => {
    const inventoryItemId = getIdGenerator().generate();
    const held = await stack.holdReservation.execute({
      requestId: `c3-${inventoryItemId}`,
      listingId: getIdGenerator().generate(),
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
      ttlMs: -5_000,
    });
    expect(held.outcome).toBe("held");
    if (held.outcome !== "held") return;

    const { expired } = await stack.expireReservations.execute({
      requestId: `c3-expire-${inventoryItemId}`,
    });
    expect(expired.some((r) => r.id === held.reservation.id)).toBe(true);
    expect(
      await stack.tx.runInTransaction((t) =>
        stack.reservations.findById(t, held.reservation.id),
      ),
    ).toMatchObject({ status: "EXPIRED" });
  });

  it("C4 — Confirm HELD → CONFIRMED + outbox", async () => {
    const inventoryItemId = getIdGenerator().generate();
    const held = await stack.holdReservation.execute({
      requestId: `c4-${inventoryItemId}`,
      listingId: getIdGenerator().generate(),
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(held.outcome).toBe("held");
    if (held.outcome !== "held") return;

    const { reservation } = await stack.confirmReservation.execute({
      requestId: `c4-conf-${inventoryItemId}`,
      reservationId: held.reservation.id,
    });
    expect(reservation.status).toBe("CONFIRMED");

    // CONFIRMED still blocks capacity
    const other = await stack.holdReservation.execute({
      requestId: `c4-other-${inventoryItemId}`,
      listingId: getIdGenerator().generate(),
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(other.outcome).toBe("rejected");
  });

  it("C5 — Release frees capacity for next buyer", async () => {
    const inventoryItemId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();
    const a = await stack.holdReservation.execute({
      requestId: `c5-a-${inventoryItemId}`,
      listingId,
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(a.outcome).toBe("held");
    if (a.outcome !== "held") return;

    await stack.releaseReservation.execute({
      requestId: `c5-rel-${inventoryItemId}`,
      reservationId: a.reservation.id,
    });

    const b = await stack.holdReservation.execute({
      requestId: `c5-b-${inventoryItemId}`,
      listingId,
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(b.outcome).toBe("held");
  });
});
