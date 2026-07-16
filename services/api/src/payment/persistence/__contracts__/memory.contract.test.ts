import { describe } from "vitest";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryPaymentRepository } from "../InMemoryPaymentRepository.js";
import { registerPaymentRepositoryContract } from "./payment.contract.js";
import type { PaymentContractFactory } from "./payment.contract.js";

describe("Payment persistence contracts [InMemory]", () => {
  const factory: PaymentContractFactory = async () => {
    const payments = new InMemoryPaymentRepository();
    const tx = new InMemoryTransactionManager([payments]);
    return { label: "InMemory", tx, payments };
  };
  registerPaymentRepositoryContract(factory);
});
