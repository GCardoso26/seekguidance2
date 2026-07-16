import { createDomainEvent } from "../../../shared/events/types.js";
import type { OutboxRepository } from "../../../platform/outbox/types.js";
import type { TransactionManager } from "../../../platform/transaction/types.js";
import type { InventoryReservationRepository } from "../../domain/InventoryReservationRepository.js";
import type { ReservationTransitionResult } from "../domain/ReservationResult.js";

export interface ReleaseReservationInput {
  requestId: string;
  reservationId: string;
}

/** HELD → RELEASED — stock available again for other buyers. */
export class ReleaseReservationApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly reservations: InventoryReservationRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  execute(input: ReleaseReservationInput): Promise<ReservationTransitionResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      const current = await this.reservations.findById(txCtx, input.reservationId);
      if (!current) throw new Error("reservation_not_found");

      const reservation = await this.reservations.updateStatus(
        txCtx,
        input.reservationId,
        "RELEASED",
        current.rowVersion,
      );

      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "ReservationReleased",
          reservation.id,
          {
            inventoryItemId: reservation.inventoryItemId,
            buyerId: reservation.buyerId,
            quantity: reservation.quantity,
          },
          {
            requestId: input.requestId,
            aggregateType: "inventory_reservation",
            producer: "ReleaseReservationApplicationService",
          },
        ),
      });

      return { reservation };
    });
  }
}
