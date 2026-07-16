import { describe, expect, it } from "vitest";
import { createInMemoryOrderStack } from "../../createInMemoryOrderStack.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { assertReservationTransition } from "../domain/ReservationPolicy.js";
import { evaluateHoldCapacity } from "../domain/ReservationEngine.js";

describe("Sprint 5.3 — Reservation Engine (InMemory)", () => {
  it("evaluateHoldCapacity rejects oversell", () => {
    expect(
      evaluateHoldCapacity({
        availableQuantity: 1,
        reservedQuantity: 1,
        requestQuantity: 1,
      }),
    ).toEqual({ allow: false, reason: "OUT_OF_STOCK" });
    expect(
      evaluateHoldCapacity({
        availableQuantity: 1,
        reservedQuantity: 0,
        requestQuantity: 1,
      }),
    ).toEqual({ allow: true });
  });

  it("invalid transitions fail", () => {
    expect(() => assertReservationTransition("CONFIRMED", "HELD")).toThrow(
      /reservation_transition_invalid/,
    );
    expect(() => assertReservationTransition("HELD", "CONFIRMED")).not.toThrow();
  });

  it("C1 — stock=1: A held, B rejected (serialized)", async () => {
    const stack = createInMemoryOrderStack();
    const inventoryItemId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();

    const [a, b] = await Promise.all([
      stack.holdReservation.execute({
        requestId: "hold-a",
        listingId,
        inventoryItemId,
        buyerId: getIdGenerator().generate(),
        quantity: 1,
        availableQuantity: 1,
      }),
      stack.holdReservation.execute({
        requestId: "hold-b",
        listingId,
        inventoryItemId,
        buyerId: getIdGenerator().generate(),
        quantity: 1,
        availableQuantity: 1,
      }),
    ]);

    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(["held", "rejected"]);
    const held = a.outcome === "held" ? a : b;
    const rejected = a.outcome === "rejected" ? a : b;
    expect(held.outcome).toBe("held");
    expect(rejected.outcome).toBe("rejected");
    if (rejected.outcome === "rejected") {
      expect(rejected.reason).toBe("OUT_OF_STOCK");
    }
  });

  it("C2 — retry same requestId is idempotent", async () => {
    const stack = createInMemoryOrderStack();
    const inventoryItemId = getIdGenerator().generate();
    const input = {
      requestId: "idem-1",
      listingId: getIdGenerator().generate(),
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    };
    const first = await stack.holdReservation.execute(input);
    const second = await stack.holdReservation.execute(input);
    expect(first.outcome).toBe("held");
    expect(second.outcome).toBe("held");
    if (first.outcome === "held" && second.outcome === "held") {
      expect(second.idempotent).toBe(true);
      expect(second.reservation.id).toBe(first.reservation.id);
    }
    expect(
      await stack.tx.runInTransaction((t) =>
        stack.reservations.heldQuantityForInventory(t, inventoryItemId),
      ),
    ).toBe(1);
  });

  it("C3 — ExpireReservations moves past-due HELD → EXPIRED", async () => {
    const stack = createInMemoryOrderStack();
    const held = await stack.holdReservation.execute({
      requestId: "exp-1",
      listingId: getIdGenerator().generate(),
      inventoryItemId: getIdGenerator().generate(),
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
      ttlMs: -1_000,
    });
    expect(held.outcome).toBe("held");
    if (held.outcome !== "held") return;

    const { expired } = await stack.expireReservations.execute({ requestId: "exp-run" });
    expect(expired).toHaveLength(1);
    expect(expired[0]!.status).toBe("EXPIRED");
    expect(expired[0]!.id).toBe(held.reservation.id);

    const claimed = await stack.outbox.claimBatch({
      workerId: "w",
      leaseMs: 5_000,
      limit: 20,
    });
    expect(claimed.some((r) => r.eventName === "ReservationExpired")).toBe(true);
  });

  it("C4 — Confirm emits ReservationConfirmed", async () => {
    const stack = createInMemoryOrderStack();
    const held = await stack.holdReservation.execute({
      requestId: "conf-1",
      listingId: getIdGenerator().generate(),
      inventoryItemId: getIdGenerator().generate(),
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(held.outcome).toBe("held");
    if (held.outcome !== "held") return;

    const { reservation } = await stack.confirmReservation.execute({
      requestId: "conf-2",
      reservationId: held.reservation.id,
    });
    expect(reservation.status).toBe("CONFIRMED");

    await expect(
      stack.confirmReservation.execute({
        requestId: "conf-3",
        reservationId: held.reservation.id,
      }),
    ).rejects.toThrow(/reservation_transition_invalid/);

    const claimed = await stack.outbox.claimBatch({
      workerId: "w",
      leaseMs: 5_000,
      limit: 20,
    });
    expect(claimed.some((r) => r.eventName === "ReservationConfirmed")).toBe(true);
  });

  it("C5 — Release frees stock for another buyer", async () => {
    const stack = createInMemoryOrderStack();
    const inventoryItemId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();

    const a = await stack.holdReservation.execute({
      requestId: "rel-a",
      listingId,
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(a.outcome).toBe("held");
    if (a.outcome !== "held") return;

    await stack.releaseReservation.execute({
      requestId: "rel-free",
      reservationId: a.reservation.id,
    });

    const b = await stack.holdReservation.execute({
      requestId: "rel-b",
      listingId,
      inventoryItemId,
      buyerId: getIdGenerator().generate(),
      quantity: 1,
      availableQuantity: 1,
    });
    expect(b.outcome).toBe("held");
  });
});
