import type { TxContext } from "../../platform/transaction/types.js";
import type { Order, OrderItem, OrderStatus } from "./models.js";

export interface CreateOrderInput {
  id?: string;
  buyerId: string;
  checkoutSessionId: string;
  items: Omit<OrderItem, "id">[];
  currency?: "BRL";
}

export interface OrderRepository {
  create(tx: TxContext, input: CreateOrderInput): Promise<Order>;
  findById(tx: TxContext, id: string): Promise<Order | null>;
  listByBuyer(tx: TxContext, buyerId: string): Promise<Order[]>;
  updateStatus(
    tx: TxContext,
    id: string,
    status: OrderStatus,
    expectedVersion?: number,
  ): Promise<Order>;
}
