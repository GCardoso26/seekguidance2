import { Pool } from "pg";
import { PostgresTransactionManager } from "../platform/transaction/PostgresTransactionManager.js";
import { PostgresOutboxRepository } from "../platform/outbox/PostgresOutboxRepository.js";
import { RequestPaymentApplicationService } from "./application/RequestPaymentApplicationService.js";
import { ApplyPaymentWebhookApplicationService } from "./application/ApplyPaymentWebhookApplicationService.js";
import { FakePaymentProvider } from "./infrastructure/fake/FakePaymentProvider.js";
import type { FakePaymentMode } from "./domain/PaymentGateway.js";
import { PostgresPaymentRepository } from "./persistence/PostgresPaymentRepository.js";

export function createPostgresPaymentStack(
  pool: Pool,
  opts?: { mode?: FakePaymentMode },
) {
  const tx = new PostgresTransactionManager(pool);
  const payments = new PostgresPaymentRepository();
  const outbox = new PostgresOutboxRepository(pool);
  const gateway = new FakePaymentProvider(opts?.mode ?? "async");

  return {
    pool,
    tx,
    payments,
    outbox,
    gateway,
    requestPayment: new RequestPaymentApplicationService(tx, payments, gateway, outbox),
    applyPaymentWebhook: new ApplyPaymentWebhookApplicationService(tx, payments, outbox),
  };
}

export type PostgresPaymentStack = ReturnType<typeof createPostgresPaymentStack>;
