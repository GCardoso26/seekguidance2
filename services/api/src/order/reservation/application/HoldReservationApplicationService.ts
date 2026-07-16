import { createDomainEvent } from "../../../shared/events/types.js";
import type { OutboxRepository } from "../../../platform/outbox/types.js";
import type { TransactionManager } from "../../../platform/transaction/types.js";
import type { InventoryReservationRepository } from "../../domain/InventoryReservationRepository.js";
import { evaluateHoldCapacity } from "../domain/ReservationEngine.js";
import {
  DEFAULT_RESERVATION_TTL_MS,
} from "../domain/ReservationPolicy.js";
import type { ReservationHoldResult } from "../domain/ReservationResult.js";
import { domainMetrics } from "../../../observability/metrics/domainMetrics.js";

export interface HoldReservationInput {
  requestId: string;
  listingId: string;
  inventoryItemId: string;
  buyerId: string;
  quantity: number;
  /** Declared available stock for this inventory item (Order does not mutate Marketplace). */
  availableQuantity: number;
  ttlMs?: number;
}

/**
 * Hold stock for a buyer — advisory-locked capacity check (Sprint 5.3).
 * Does not decrement marketplace.inventory; only tracks reservation.* HELD.
 */
export class HoldReservationApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly reservations: InventoryReservationRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  execute(input: HoldReservationInput): Promise<ReservationHoldResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      const existing = await this.reservations.findByRequestId(txCtx, input.requestId);
      if (existing) {
        return { outcome: "held" as const, reservation: existing, idempotent: true };
      }

      await this.reservations.lockInventoryItem(txCtx, input.inventoryItemId);

      // Re-check after lock (concurrent retry raced ahead).
      const again = await this.reservations.findByRequestId(txCtx, input.requestId);
      if (again) {
        return { outcome: "held" as const, reservation: again, idempotent: true };
      }

      const reserved = await this.reservations.reservedQuantityForInventory(
        txCtx,
        input.inventoryItemId,
      );
      const decision = evaluateHoldCapacity({
        availableQuantity: input.availableQuantity,
        reservedQuantity: reserved,
        requestQuantity: input.quantity,
      });

      if (!decision.allow) {
        domainMetrics.reservationConflict();
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "ReservationRejected",
            input.inventoryItemId,
            {
              buyerId: input.buyerId,
              listingId: input.listingId,
              inventoryItemId: input.inventoryItemId,
              quantity: input.quantity,
              reason: decision.reason,
              availableQuantity: input.availableQuantity,
              reservedQuantity: reserved,
            },
            {
              requestId: input.requestId,
              aggregateType: "inventory_reservation",
              producer: "HoldReservationApplicationService",
            },
          ),
        });
        return { outcome: "rejected", reason: decision.reason };
      }

      const reservation = await this.reservations.create(txCtx, {
        listingId: input.listingId,
        inventoryItemId: input.inventoryItemId,
        buyerId: input.buyerId,
        quantity: input.quantity,
        ttlMs: input.ttlMs ?? DEFAULT_RESERVATION_TTL_MS,
        requestId: input.requestId,
      });

      await this.outbox.insert(txCtx, {
        event: createDomainEvent(
          "ReservationHeld",
          reservation.id,
          {
            listingId: reservation.listingId,
            inventoryItemId: reservation.inventoryItemId,
            buyerId: reservation.buyerId,
            quantity: reservation.quantity,
            expiresAt: reservation.expiresAt.toISOString(),
          },
          {
            requestId: input.requestId,
            aggregateType: "inventory_reservation",
            producer: "HoldReservationApplicationService",
          },
        ),
      });

      domainMetrics.reservationHold();
      return { outcome: "held", reservation, idempotent: false };
    });
  }
}
