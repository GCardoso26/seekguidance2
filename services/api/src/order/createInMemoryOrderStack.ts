import { InMemoryTransactionManager } from "../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryOutboxRepository } from "../platform/outbox/InMemoryOutboxRepository.js";
import { createOrderApplicationServices } from "./application/createOrderApplicationServices.js";
import { InMemoryCartRepository } from "./persistence/InMemoryCartRepository.js";
import { InMemoryCheckoutSessionRepository } from "./persistence/InMemoryCheckoutSessionRepository.js";
import { InMemoryInventoryReservationRepository } from "./persistence/InMemoryInventoryReservationRepository.js";
import { InMemoryOrderRepository } from "./persistence/InMemoryOrderRepository.js";

/**
 * In-memory Order stack — Cart · Checkout · Order · Reservation.
 * Payment BC is separate (createInMemoryPaymentStack) — Sprint 5.5.
 */
export function createInMemoryOrderStack() {
  const carts = new InMemoryCartRepository();
  const checkouts = new InMemoryCheckoutSessionRepository();
  const orders = new InMemoryOrderRepository();
  const reservations = new InMemoryInventoryReservationRepository();
  const outbox = new InMemoryOutboxRepository();
  const tx = new InMemoryTransactionManager([
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
  ]);

  const apps = createOrderApplicationServices({
    tx,
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
  });

  return {
    tx,
    carts,
    checkouts,
    orders,
    reservations,
    outbox,
    ...apps,
  };
}
