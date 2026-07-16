import { createDomainEvent } from "../../../shared/events/types.js";
import type { OutboxRepository } from "../../../platform/outbox/types.js";
import type { TransactionManager } from "../../../platform/transaction/types.js";
import { getClock } from "../../../shared/time/Clock.js";
import type { InventoryReservationRepository } from "../../domain/InventoryReservationRepository.js";
import type { InventoryReservation } from "../../domain/models.js";
import { domainMetrics } from "../../../observability/metrics/domainMetrics.js";

export interface ExpireReservationsResult {
  expired: InventoryReservation[];
}

/** Sweep HELD with expires_at ≤ now → EXPIRED + ReservationExpired (Outbox). */
export class ExpireReservationsApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly reservations: InventoryReservationRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  execute(input?: { requestId?: string }): Promise<ExpireReservationsResult> {
    const requestId = input?.requestId ?? `expire-${getClock().now().getTime()}`;
    return this.tx.runInTransaction(async (txCtx) => {
      const now = getClock().now();
      const due = await this.reservations.listExpiredHeld(txCtx, now);
      const expired: InventoryReservation[] = [];

      for (const row of due) {
        const updated = await this.reservations.updateStatus(
          txCtx,
          row.id,
          "EXPIRED",
          row.rowVersion,
        );
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "ReservationExpired",
            updated.id,
            {
              inventoryItemId: updated.inventoryItemId,
              buyerId: updated.buyerId,
              quantity: updated.quantity,
              expiresAt: updated.expiresAt.toISOString(),
            },
            {
              requestId,
              aggregateType: "inventory_reservation",
              producer: "ExpireReservationsApplicationService",
            },
          ),
        });
        expired.push(updated);
      }

      if (expired.length > 0) domainMetrics.reservationExpired(expired.length);
      return { expired };
    });
  }
}
