import type { ReservationRejectReason } from "./ReservationResult.js";

export interface HoldCapacityInput {
  availableQuantity: number;
  reservedQuantity: number;
  requestQuantity: number;
}

export type HoldCapacityDecision =
  | { allow: true }
  | { allow: false; reason: ReservationRejectReason };

/**
 * Pure capacity check — no IO.
 * Guarantees: reserved + request ≤ available (no oversell).
 */
export function evaluateHoldCapacity(input: HoldCapacityInput): HoldCapacityDecision {
  if (input.requestQuantity <= 0 || !Number.isFinite(input.requestQuantity)) {
    return { allow: false, reason: "INVALID_QUANTITY" };
  }
  if (input.availableQuantity < 0 || input.reservedQuantity < 0) {
    return { allow: false, reason: "INVALID_QUANTITY" };
  }
  if (input.reservedQuantity + input.requestQuantity > input.availableQuantity) {
    return { allow: false, reason: "OUT_OF_STOCK" };
  }
  return { allow: true };
}
