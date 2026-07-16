import { describe } from "vitest";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryOutboxRepository } from "../../../platform/outbox/InMemoryOutboxRepository.js";
import { InMemoryCartRepository } from "../InMemoryCartRepository.js";
import { InMemoryCheckoutSessionRepository } from "../InMemoryCheckoutSessionRepository.js";
import { InMemoryOrderRepository } from "../InMemoryOrderRepository.js";
import { InMemoryInventoryReservationRepository } from "../InMemoryInventoryReservationRepository.js";
import { registerCartRepositoryContract } from "./cart.contract.js";
import { registerOrderRepositoryContract } from "./order.contract.js";
import { registerReservationRepositoryContract } from "./reservation.contract.js";
import { registerFinancialSafetyContract } from "./financialSafety.contract.js";
import type { OrderContractFactory } from "./types.js";

const memoryFactory: OrderContractFactory = async () => {
  const carts = new InMemoryCartRepository();
  const checkouts = new InMemoryCheckoutSessionRepository();
  const orders = new InMemoryOrderRepository();
  const reservations = new InMemoryInventoryReservationRepository();
  const outbox = new InMemoryOutboxRepository();
  const tx = new InMemoryTransactionManager([carts, checkouts, orders, reservations, outbox]);
  return {
    label: "InMemory",
    ns: `mem-${getIdGenerator().generate().slice(0, 8)}`,
    tx,
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
  };
};

describe("Order persistence contracts [InMemory]", () => {
  registerCartRepositoryContract(memoryFactory);
  registerOrderRepositoryContract(memoryFactory);
  registerReservationRepositoryContract(memoryFactory);
  registerFinancialSafetyContract(memoryFactory);
});
