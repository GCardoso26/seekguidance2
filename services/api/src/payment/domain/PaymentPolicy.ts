import type { PaymentStatus } from "./models.js";

const ALLOWED: Record<PaymentStatus, readonly PaymentStatus[]> = {
  CREATED: ["REQUESTED", "CANCELLED"],
  REQUESTED: ["AUTHORIZED", "FAILED", "CANCELLED"],
  AUTHORIZED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canPaymentTransition(from, to)) {
    throw new Error(`payment_transition_invalid:${from}->${to}`);
  }
}

/** Terminal states ignore conflicting webhooks (consistent final state). */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return status === "AUTHORIZED" || status === "FAILED" || status === "CANCELLED";
}
