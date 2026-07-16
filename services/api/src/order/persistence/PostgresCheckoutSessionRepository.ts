import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  CheckoutSessionRepository,
  CreateCheckoutInput,
} from "../domain/CheckoutSessionRepository.js";
import type { CheckoutSession, CheckoutStatus } from "../domain/models.js";

export class PostgresCheckoutSessionRepository implements CheckoutSessionRepository {
  async create(tx: TxContext, input: CreateCheckoutInput): Promise<CheckoutSession> {
    const client = requirePostgresClient(tx);
    const id = input.id ?? getIdGenerator().generate();
    const res = await client.query(
      `
      INSERT INTO "order".checkout_sessions (id, cart_id, buyer_id, status, row_version)
      VALUES ($1, $2, $3, 'CREATED', 1)
      RETURNING *
      `,
      [id, input.cartId, input.buyerId],
    );
    return mapSession(res.rows[0]);
  }

  async findById(tx: TxContext, id: string): Promise<CheckoutSession | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM "order".checkout_sessions WHERE id = $1`,
      [id],
    );
    return res.rows[0] ? mapSession(res.rows[0]) : null;
  }

  async updateStatus(
    tx: TxContext,
    id: string,
    status: CheckoutStatus,
    opts?: { orderId?: string; expectedVersion?: number },
  ): Promise<CheckoutSession> {
    const client = requirePostgresClient(tx);
    const existing = await this.findById(tx, id);
    if (!existing) throw new Error("checkout_not_found");
    if (opts?.expectedVersion != null && existing.rowVersion !== opts.expectedVersion) {
      throw new Error(`optimistic_lock_failed:checkout:${id}`);
    }
    const res = await client.query(
      `
      UPDATE "order".checkout_sessions
      SET status = $2,
          order_id = COALESCE($3, order_id),
          row_version = row_version + 1,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, opts?.orderId ?? null],
    );
    return mapSession(res.rows[0]);
  }
}

function mapSession(row: Record<string, unknown>): CheckoutSession {
  return {
    id: String(row.id),
    cartId: String(row.cart_id),
    buyerId: String(row.buyer_id),
    status: row.status as CheckoutStatus,
    orderId: row.order_id != null ? String(row.order_id) : null,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
