import type { InventoryReservation } from "../../domain/models.js";

export type ReservationRejectReason = "OUT_OF_STOCK" | "INVALID_QUANTITY";

export type ReservationHoldResult =
  | { outcome: "held"; reservation: InventoryReservation; idempotent: boolean }
  | { outcome: "rejected"; reason: ReservationRejectReason };

export type ReservationTransitionResult = {
  reservation: InventoryReservation;
};
