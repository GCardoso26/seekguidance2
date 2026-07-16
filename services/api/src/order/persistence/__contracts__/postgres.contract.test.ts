import { describe } from "vitest";
import { Pool } from "pg";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { PostgresTransactionManager } from "../../../platform/transaction/PostgresTransactionManager.js";
import { PostgresOutboxRepository } from "../../../platform/outbox/PostgresOutboxRepository.js";
import { PostgresCartRepository } from "../PostgresCartRepository.js";
import { PostgresCheckoutSessionRepository } from "../PostgresCheckoutSessionRepository.js";
import { PostgresOrderRepository } from "../PostgresOrderRepository.js";
import { PostgresInventoryReservationRepository } from "../PostgresInventoryReservationRepository.js";
import { registerCartRepositoryContract } from "./cart.contract.js";
import { registerOrderRepositoryContract } from "./order.contract.js";
import { registerReservationRepositoryContract } from "./reservation.contract.js";
import { registerFinancialSafetyContract } from "./financialSafety.contract.js";
import type { OrderContractFactory } from "./types.js";

const databaseUrl = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

/**
 * Order persistence contracts [Postgres] — skipped unless DB URL is set.
 * Same asserts as InMemory. Teardown by buyer_id / ns prefix.
 */
describe.skipIf(!databaseUrl)("Order persistence contracts [Postgres]", () => {
  const factory: OrderContractFactory = async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const tx = new PostgresTransactionManager(pool);
    const ns = `ct-${getIdGenerator().generate().slice(0, 8)}`;
    const buyerIds: string[] = [];

    return {
      label: "Postgres",
      ns,
      tx,
      carts: new PostgresCartRepository(),
      checkouts: new PostgresCheckoutSessionRepository(),
      orders: new PostgresOrderRepository(),
      reservations: new PostgresInventoryReservationRepository(),
      outbox: new PostgresOutboxRepository(pool),
      teardown: async () => {
        try {
          // Clean by recent carts (CASCADE items) — contracts create isolated UUIDs.
          await pool.query(`
            DELETE FROM "order".order_items
            WHERE order_id IN (
              SELECT id FROM "order".orders WHERE created_at > now() - interval '1 hour'
            )
          `);
          await pool.query(`
            DELETE FROM "order".orders WHERE created_at > now() - interval '1 hour'
          `);
          await pool.query(`
            DELETE FROM "order".checkout_sessions WHERE created_at > now() - interval '1 hour'
          `);
          await pool.query(`
            DELETE FROM cart.cart_items WHERE cart_id IN (
              SELECT id FROM cart.carts WHERE created_at > now() - interval '1 hour'
            )
          `);
          await pool.query(`
            DELETE FROM cart.carts WHERE created_at > now() - interval '1 hour'
          `);
          await pool.query(`
            DELETE FROM reservation.inventory_reservations
            WHERE created_at > now() - interval '1 hour'
          `);
          void buyerIds;
        } finally {
          await pool.end();
        }
      },
    };
  };

  registerCartRepositoryContract(factory);
  registerOrderRepositoryContract(factory);
  registerReservationRepositoryContract(factory);
  registerFinancialSafetyContract(factory);
});
