import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  CheckoutSessionRepository,
  CreateCheckoutInput,
} from "../domain/CheckoutSessionRepository.js";
import type { CheckoutSession, CheckoutStatus } from "../domain/models.js";

export class InMemoryCheckoutSessionRepository
  implements CheckoutSessionRepository, TxParticipant
{
  private rows = new Map<string, CheckoutSession>();
  private snapshots = new Map<string, Map<string, CheckoutSession>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  async create(_tx: TxContext, input: CreateCheckoutInput): Promise<CheckoutSession> {
    const now = getClock().now();
    const session: CheckoutSession = {
      id: input.id ?? getIdGenerator().generate(),
      cartId: input.cartId,
      buyerId: input.buyerId,
      status: "CREATED",
      orderId: null,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(session.id, session);
    return structuredClone(session);
  }

  async findById(_tx: TxContext, id: string): Promise<CheckoutSession | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async updateStatus(
    _tx: TxContext,
    id: string,
    status: CheckoutStatus,
    opts?: { orderId?: string; expectedVersion?: number },
  ): Promise<CheckoutSession> {
    const session = this.rows.get(id);
    if (!session) throw new Error("checkout_not_found");
    if (opts?.expectedVersion != null && session.rowVersion !== opts.expectedVersion) {
      throw new Error(`optimistic_lock_failed:checkout:${id}`);
    }
    session.status = status;
    if (opts?.orderId != null) session.orderId = opts.orderId;
    session.rowVersion += 1;
    session.updatedAt = getClock().now();
    this.rows.set(id, session);
    return structuredClone(session);
  }
}

function cloneMap(src: Map<string, CheckoutSession>): Map<string, CheckoutSession> {
  const out = new Map<string, CheckoutSession>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
