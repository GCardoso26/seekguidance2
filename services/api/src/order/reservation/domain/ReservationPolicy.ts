import type { ReservationStatus } from "../../domain/models.js";

/** Allowed status transitions for InventoryReservation. */
const ALLOWED: Record<ReservationStatus, readonly ReservationStatus[]> = {
  HELD: ["CONFIRMED", "RELEASED", "EXPIRED"],
  CONFIRMED: [],
  RELEASED: [],
  EXPIRED: [],
};

export function canTransition(
  from: ReservationStatus,
  to: ReservationStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertReservationTransition(
  from: ReservationStatus,
  to: ReservationStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`reservation_transition_invalid:${from}->${to}`);
  }
}

/** Default hold TTL — 15 minutes. */
export const DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000;
