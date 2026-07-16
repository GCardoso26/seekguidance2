import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { assertPaymentTransition } from "../domain/PaymentPolicy.js";
import type {
  CreatePaymentInput,
  PaymentRepository,
} from "../domain/PaymentRepository.js";
import type { Payment, PaymentStatus } from "../domain/models.js";

export class InMemoryPaymentRepository implements PaymentRepository, TxParticipant {
  private rows = new Map<string, Payment>();
  private byRequest = new Map<string, string>();
  private events = new Set<string>();
  private snapshots = new Map<
    string,
    {
      rows: Map<string, Payment>;
      byRequest: Map<string, string>;
      events: Set<string>;
    }
  >();

  beginTx(txId: string): void {
    this.snapshots.set(txId, {
      rows: clonePayments(this.rows),
      byRequest: new Map(this.byRequest),
      events: new Set(this.events),
    });
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) {
      this.rows = snap.rows;
      this.byRequest = snap.byRequest;
      this.events = snap.events;
    }
    this.snapshots.delete(txId);
  }

  async create(_tx: TxContext, input: CreatePaymentInput): Promise<Payment> {
    if (input.amountCents <= 0) throw new Error("payment_amount_invalid");
    if (this.byRequest.has(input.requestId)) {
      throw new Error(`payment_request_id_duplicate:${input.requestId}`);
    }
    const now = getClock().now();
    const payment: Payment = {
      id: input.id ?? getIdGenerator().generate(),
      orderId: input.orderId,
      amountCents: input.amountCents,
      currency: input.currency ?? "BRL",
      status: "CREATED",
      provider: input.provider ?? "fake",
      externalReference: null,
      requestId: input.requestId,
      reservationIds: [...(input.reservationIds ?? [])],
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(payment.id, payment);
    this.byRequest.set(input.requestId, payment.id);
    return structuredClone(payment);
  }

  async findById(_tx: TxContext, id: string): Promise<Payment | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByRequestId(_tx: TxContext, requestId: string): Promise<Payment | null> {
    const id = this.byRequest.get(requestId);
    if (!id) return null;
    return this.findById(_tx, id);
  }

  async findByOrderId(_tx: TxContext, orderId: string): Promise<Payment | null> {
    const found = [...this.rows.values()].find((p) => p.orderId === orderId);
    return found ? structuredClone(found) : null;
  }

  async updateStatus(
    _tx: TxContext,
    id: string,
    status: PaymentStatus,
    opts?: { externalReference?: string | null; expectedVersion?: number },
  ): Promise<Payment> {
    const row = this.rows.get(id);
    if (!row) throw new Error("payment_not_found");
    if (opts?.expectedVersion != null && row.rowVersion !== opts.expectedVersion) {
      throw new Error(`optimistic_lock_failed:payment:${id}`);
    }
    assertPaymentTransition(row.status, status);
    row.status = status;
    if (opts?.externalReference !== undefined) {
      row.externalReference = opts.externalReference;
    }
    row.rowVersion += 1;
    row.updatedAt = getClock().now();
    this.rows.set(id, row);
    return structuredClone(row);
  }

  async recordEventIfNew(
    _tx: TxContext,
    input: {
      paymentId: string;
      eventKey: string;
      eventType: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<boolean> {
    if (this.events.has(input.eventKey)) return false;
    if (!this.rows.has(input.paymentId)) throw new Error("payment_not_found");
    this.events.add(input.eventKey);
    void input.eventType;
    void input.payload;
    return true;
  }
}

function clonePayments(src: Map<string, Payment>): Map<string, Payment> {
  const out = new Map<string, Payment>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
