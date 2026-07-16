import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { CreateOrderInput, OrderRepository } from "../domain/OrderRepository.js";
import { orderTotalFromItems, type Order, type OrderStatus } from "../domain/models.js";

export class InMemoryOrderRepository implements OrderRepository, TxParticipant {
  private rows = new Map<string, Order>();
  private snapshots = new Map<string, Map<string, Order>>();

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

  async create(_tx: TxContext, input: CreateOrderInput): Promise<Order> {
    if (input.items.length === 0) throw new Error("order_empty");
    const now = getClock().now();
    const items = input.items.map((i) => ({
      ...i,
      id: getIdGenerator().generate(),
      currency: i.currency ?? ("BRL" as const),
    }));
    const order: Order = {
      id: input.id ?? getIdGenerator().generate(),
      buyerId: input.buyerId,
      checkoutSessionId: input.checkoutSessionId,
      status: "PENDING",
      totalAmountCents: orderTotalFromItems(items),
      currency: input.currency ?? "BRL",
      items,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(order.id, order);
    return structuredClone(order);
  }

  async findById(_tx: TxContext, id: string): Promise<Order | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async listByBuyer(_tx: TxContext, buyerId: string): Promise<Order[]> {
    return [...this.rows.values()]
      .filter((o) => o.buyerId === buyerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((o) => structuredClone(o));
  }

  async updateStatus(
    _tx: TxContext,
    id: string,
    status: OrderStatus,
    expectedVersion?: number,
  ): Promise<Order> {
    const order = this.rows.get(id);
    if (!order) throw new Error("order_not_found");
    if (expectedVersion != null && order.rowVersion !== expectedVersion) {
      throw new Error(`optimistic_lock_failed:order:${id}`);
    }
    order.status = status;
    order.rowVersion += 1;
    order.updatedAt = getClock().now();
    this.rows.set(id, order);
    return structuredClone(order);
  }
}

function cloneMap(src: Map<string, Order>): Map<string, Order> {
  const out = new Map<string, Order>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
