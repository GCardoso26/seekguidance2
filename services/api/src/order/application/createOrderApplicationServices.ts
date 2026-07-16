import type { TransactionManager } from "../../platform/transaction/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { CartRepository } from "../domain/CartRepository.js";
import type { CheckoutSessionRepository } from "../domain/CheckoutSessionRepository.js";
import type { InventoryReservationRepository } from "../domain/InventoryReservationRepository.js";
import type { OrderRepository } from "../domain/OrderRepository.js";
import { ConfirmReservationApplicationService } from "../reservation/application/ConfirmReservationApplicationService.js";
import { ExpireReservationsApplicationService } from "../reservation/application/ExpireReservationsApplicationService.js";
import { HoldReservationApplicationService } from "../reservation/application/HoldReservationApplicationService.js";
import { ReleaseReservationApplicationService } from "../reservation/application/ReleaseReservationApplicationService.js";
import {
  AddCartItemApplicationService,
  CreateCartApplicationService,
  RemoveCartItemApplicationService,
} from "./CartApplicationServices.js";
import { StartCheckoutApplicationService } from "./StartCheckoutApplicationService.js";
import { SettlePaymentApplicationService } from "./SettlePaymentApplicationService.js";

/** Composition root — Order Application Services (payment request lives in payment BC). */
export function createOrderApplicationServices(deps: {
  tx: TransactionManager;
  carts: CartRepository;
  checkouts: CheckoutSessionRepository;
  orders: OrderRepository;
  reservations: InventoryReservationRepository;
  outbox: OutboxRepository;
}) {
  const holdReservation = new HoldReservationApplicationService(
    deps.tx,
    deps.reservations,
    deps.outbox,
  );
  const confirmReservation = new ConfirmReservationApplicationService(
    deps.tx,
    deps.reservations,
    deps.outbox,
  );
  const releaseReservation = new ReleaseReservationApplicationService(
    deps.tx,
    deps.reservations,
    deps.outbox,
  );

  return {
    createCart: new CreateCartApplicationService(deps.tx, deps.carts, deps.outbox),
    addCartItem: new AddCartItemApplicationService(deps.tx, deps.carts, deps.outbox),
    removeCartItem: new RemoveCartItemApplicationService(deps.tx, deps.carts),
    startCheckout: new StartCheckoutApplicationService(
      deps.tx,
      deps.carts,
      deps.checkouts,
      deps.orders,
      deps.outbox,
    ),
    holdReservation,
    confirmReservation,
    releaseReservation,
    expireReservations: new ExpireReservationsApplicationService(
      deps.tx,
      deps.reservations,
      deps.outbox,
    ),
    settlePayment: new SettlePaymentApplicationService(
      deps.tx,
      deps.orders,
      deps.checkouts,
      confirmReservation,
      releaseReservation,
      deps.outbox,
    ),
  };
}
