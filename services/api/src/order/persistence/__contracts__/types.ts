/**
 * Shared factory for Order Persistence Contract Tests.
 * Same asserts MUST run against InMemory and Postgres adapters.
 */
import type { TransactionManager, TxContext } from "../../../platform/transaction/types.js";
import type { CartRepository } from "../../domain/CartRepository.js";
import type { CheckoutSessionRepository } from "../../domain/CheckoutSessionRepository.js";
import type { OrderRepository } from "../../domain/OrderRepository.js";
import type { InventoryReservationRepository } from "../../domain/InventoryReservationRepository.js";
import type { OutboxRepository } from "../../../platform/outbox/types.js";

export interface OrderContractHarness {
  label: string;
  ns: string;
  tx: TransactionManager;
  carts: CartRepository;
  checkouts: CheckoutSessionRepository;
  orders: OrderRepository;
  reservations: InventoryReservationRepository;
  outbox: OutboxRepository;
  teardown?: () => Promise<void>;
}

export type OrderContractFactory = () => Promise<OrderContractHarness>;

export async function inTx<T>(
  tx: TransactionManager,
  fn: (ctx: TxContext) => Promise<T>,
): Promise<T> {
  return tx.runInTransaction(fn);
}
