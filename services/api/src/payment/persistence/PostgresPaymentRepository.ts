import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { assertPaymentTransition } from "../domain/PaymentPolicy.js";
import type {
  CreatePaymentInput,
  PaymentRepository,
} from "../domain/PaymentRepository.js";
import type { Payment, PaymentStatus } from "../domain/models.js";

export class PostgresPaymentRepository implements PaymentRepository {
  async create(tx: TxContext, input: CreatePaymentInput): Promise<Payment> {
    const client = requirePostgresClient(tx);
    if (input.amountCents <= 0) throw new Error("payment_amount_invalid");
    const id = input.id ?? getIdGenerator().generate();
    try {
      const res = await client.query(
        `
        INSERT INTO payment.payments
          (id, order_id, amount_cents, currency, status, provider, request_id, reservation_ids, row_version)
        VALUES ($1, $2, $3, $4, 'CREATED', $5, $6, $7::jsonb, 1)
        RETURNING *
        `,
        [
          id,
          input.orderId,
          input.amountCents,
          input.currency ?? "BRL",
          input.provider ?? "fake",
          input.requestId,
          JSON.stringify(input.reservationIds ?? []),
        ],
      );
      return mapPayment(res.rows[0]);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        throw new Error(`payment_request_id_duplicate:${input.requestId}`);
      }
      throw err;
    }
  }

  async findById(tx: TxContext, id: string): Promise<Payment | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM payment.payments WHERE id = $1`, [id]);
    return res.rows[0] ? mapPayment(res.rows[0]) : null;
  }

  async findByRequestId(tx: TxContext, requestId: string): Promise<Payment | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM payment.payments WHERE request_id = $1`,
      [requestId],
    );
    return res.rows[0] ? mapPayment(res.rows[0]) : null;
  }

  async findByOrderId(tx: TxContext, orderId: string): Promise<Payment | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `
      SELECT * FROM payment.payments
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [orderId],
    );
    return res.rows[0] ? mapPayment(res.rows[0]) : null;
  }

  async updateStatus(
    tx: TxContext,
    id: string,
    status: PaymentStatus,
    opts?: { externalReference?: string | null; expectedVersion?: number },
  ): Promise<Payment> {
    const client = requirePostgresClient(tx);
    const existing = await this.findById(tx, id);
    if (!existing) throw new Error("payment_not_found");
    if (opts?.expectedVersion != null && existing.rowVersion !== opts.expectedVersion) {
      throw new Error(`optimistic_lock_failed:payment:${id}`);
    }
    assertPaymentTransition(existing.status, status);
    const external =
      opts?.externalReference !== undefined
        ? opts.externalReference
        : existing.externalReference;
    const res = await client.query(
      `
      UPDATE payment.payments
      SET status = $2,
          external_reference = $3,
          row_version = row_version + 1,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, external],
    );
    return mapPayment(res.rows[0]);
  }

  async recordEventIfNew(
    tx: TxContext,
    input: {
      paymentId: string;
      eventKey: string;
      eventType: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<boolean> {
    const client = requirePostgresClient(tx);
    try {
      await client.query(
        `
        INSERT INTO payment.payment_events (id, payment_id, event_key, event_type, payload)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          getIdGenerator().generate(),
          input.paymentId,
          input.eventKey,
          input.eventType,
          JSON.stringify(input.payload ?? {}),
        ],
      );
      return true;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") return false;
      throw err;
    }
  }
}

function mapPayment(row: Record<string, unknown>): Payment {
  const rawIds = row.reservation_ids;
  let reservationIds: string[] = [];
  if (Array.isArray(rawIds)) {
    reservationIds = rawIds.map(String);
  } else if (typeof rawIds === "string") {
    try {
      reservationIds = (JSON.parse(rawIds) as unknown[]).map(String);
    } catch {
      reservationIds = [];
    }
  }
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    amountCents: Number(row.amount_cents),
    currency: row.currency as "BRL",
    status: row.status as Payment["status"],
    provider: row.provider as Payment["provider"],
    externalReference: row.external_reference != null ? String(row.external_reference) : null,
    requestId: String(row.request_id),
    reservationIds,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
