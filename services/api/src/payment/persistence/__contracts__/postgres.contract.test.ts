import { describe } from "vitest";
import { Pool } from "pg";
import { PostgresTransactionManager } from "../../../platform/transaction/PostgresTransactionManager.js";
import { PostgresPaymentRepository } from "../PostgresPaymentRepository.js";
import { registerPaymentRepositoryContract } from "./payment.contract.js";
import type { PaymentContractFactory } from "./payment.contract.js";

const databaseUrl = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

describe.skipIf(!databaseUrl)("Payment persistence contracts [Postgres]", () => {
  const factory: PaymentContractFactory = async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const tx = new PostgresTransactionManager(pool);
    return {
      label: "Postgres",
      tx,
      payments: new PostgresPaymentRepository(),
      teardown: async () => {
        try {
          await pool.query(
            `DELETE FROM payment.payment_events WHERE created_at > now() - interval '1 hour'`,
          );
          await pool.query(
            `DELETE FROM payment.payments WHERE created_at > now() - interval '1 hour'`,
          );
        } finally {
          await pool.end();
        }
      },
    };
  };
  registerPaymentRepositoryContract(factory);
});
