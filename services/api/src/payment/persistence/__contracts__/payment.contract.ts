import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { TransactionManager } from "../../../platform/transaction/types.js";
import type { PaymentRepository } from "../../domain/PaymentRepository.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

export interface PaymentContractHarness {
  label: string;
  tx: TransactionManager;
  payments: PaymentRepository;
  teardown?: () => Promise<void>;
}

export type PaymentContractFactory = () => Promise<PaymentContractHarness>;

function inTx<T>(
  tx: TransactionManager,
  fn: (t: Parameters<Parameters<TransactionManager["runInTransaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  return tx.runInTransaction(fn);
}

export function registerPaymentRepositoryContract(factory: PaymentContractFactory): void {
  describe("PaymentRepository contract", () => {
    let h: PaymentContractHarness;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / update REQUESTED / optimistic lock", async () => {
      const requestId = getIdGenerator().generate();
      const payment = await inTx(h.tx, (tx) =>
        h.payments.create(tx, {
          orderId: getIdGenerator().generate(),
          amountCents: 1500,
          requestId,
        }),
      );
      expect(payment.status).toBe("CREATED");

      const requested = await inTx(h.tx, (tx) =>
        h.payments.updateStatus(tx, payment.id, "REQUESTED", {
          externalReference: "fake_x",
          expectedVersion: payment.rowVersion,
        }),
      );
      expect(requested.status).toBe("REQUESTED");

      await expect(
        inTx(h.tx, (tx) =>
          h.payments.updateStatus(tx, payment.id, "AUTHORIZED", { expectedVersion: 99 }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Idempotency — findByRequestId", async () => {
      const requestId = getIdGenerator().generate();
      const created = await inTx(h.tx, (tx) =>
        h.payments.create(tx, {
          orderId: getIdGenerator().generate(),
          amountCents: 900,
          requestId,
        }),
      );
      const found = await inTx(h.tx, (tx) => h.payments.findByRequestId(tx, requestId));
      expect(found?.id).toBe(created.id);
    });

    it("Webhook event key — duplicate is no-op", async () => {
      const payment = await inTx(h.tx, (tx) =>
        h.payments.create(tx, {
          orderId: getIdGenerator().generate(),
          amountCents: 500,
          requestId: getIdGenerator().generate(),
        }),
      );
      const key = `evt-${payment.id}`;
      const first = await inTx(h.tx, (tx) =>
        h.payments.recordEventIfNew(tx, {
          paymentId: payment.id,
          eventKey: key,
          eventType: "payment.approved",
        }),
      );
      const second = await inTx(h.tx, (tx) =>
        h.payments.recordEventIfNew(tx, {
          paymentId: payment.id,
          eventKey: key,
          eventType: "payment.approved",
        }),
      );
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("Rollback discards payment", async () => {
      const id = getIdGenerator().generate();
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.payments.create(tx, {
            id,
            orderId: getIdGenerator().generate(),
            amountCents: 100,
            requestId: getIdGenerator().generate(),
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.payments.findById(tx, id));
      expect(found).toBeNull();
    });

    it("Invalid transition AUTHORIZED → FAILED fails", async () => {
      const payment = await inTx(h.tx, (tx) =>
        h.payments.create(tx, {
          orderId: getIdGenerator().generate(),
          amountCents: 200,
          requestId: getIdGenerator().generate(),
        }),
      );
      const requested = await inTx(h.tx, (tx) =>
        h.payments.updateStatus(tx, payment.id, "REQUESTED", {
          expectedVersion: payment.rowVersion,
        }),
      );
      await inTx(h.tx, (tx) =>
        h.payments.updateStatus(tx, payment.id, "AUTHORIZED", {
          expectedVersion: requested.rowVersion,
        }),
      );
      await expect(
        inTx(h.tx, (tx) => h.payments.updateStatus(tx, payment.id, "FAILED")),
      ).rejects.toThrow(/payment_transition_invalid/);
    });
  });
}
