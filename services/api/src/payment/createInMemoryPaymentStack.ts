import { InMemoryTransactionManager } from "../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryOutboxRepository } from "../platform/outbox/InMemoryOutboxRepository.js";
import { RequestPaymentApplicationService } from "./application/RequestPaymentApplicationService.js";
import { ApplyPaymentWebhookApplicationService } from "./application/ApplyPaymentWebhookApplicationService.js";
import { FakePaymentProvider } from "./infrastructure/fake/FakePaymentProvider.js";
import type { FakePaymentMode } from "./domain/PaymentGateway.js";
import { InMemoryPaymentRepository } from "./persistence/InMemoryPaymentRepository.js";

export function createInMemoryPaymentStack(opts?: { mode?: FakePaymentMode }) {
  const payments = new InMemoryPaymentRepository();
  const outbox = new InMemoryOutboxRepository();
  const tx = new InMemoryTransactionManager([payments, outbox]);
  const gateway = new FakePaymentProvider(opts?.mode ?? "async");

  return {
    tx,
    payments,
    outbox,
    gateway,
    requestPayment: new RequestPaymentApplicationService(tx, payments, gateway, outbox),
    applyPaymentWebhook: new ApplyPaymentWebhookApplicationService(tx, payments, outbox),
  };
}

export type InMemoryPaymentStack = ReturnType<typeof createInMemoryPaymentStack>;
