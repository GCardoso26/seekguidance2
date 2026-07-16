import type { Pool } from "pg";
import { PostgresTransactionManager } from "../platform/transaction/PostgresTransactionManager.js";
import { PostgresOutboxRepository } from "../platform/outbox/PostgresOutboxRepository.js";
import { createOrderApplicationServices } from "./application/createOrderApplicationServices.js";
import { PostgresCartRepository } from "./persistence/PostgresCartRepository.js";
import { PostgresCheckoutSessionRepository } from "./persistence/PostgresCheckoutSessionRepository.js";
import { PostgresInventoryReservationRepository } from "./persistence/PostgresInventoryReservationRepository.js";
import { PostgresOrderRepository } from "./persistence/PostgresOrderRepository.js";

/**
 * Composition root — Postgres adapters for Order (Sprint 5.2+).
 * Payment BC uses createPostgresPaymentStack (Sprint 5.5).
 */
export function createPostgresOrderStack(pool: Pool) {
  const tx = new PostgresTransactionManager(pool);
  const carts = new PostgresCartRepository();
  const checkouts = new PostgresCheckoutSessionRepository();
  const orders = new PostgresOrderRepository();
  const reservations = new PostgresInventoryReservationRepository();
  const outbox = new PostgresOutboxRepository(pool);

  const apps = createOrderApplicationServices({
    tx,
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
  });

  return {
    pool,
    tx,
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
    ...apps,
  };
}

export type PostgresOrderStack = ReturnType<typeof createPostgresOrderStack>;
