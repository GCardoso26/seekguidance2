import { ESCROW_DEADLINES, ESCROW_FEE_RATE } from "@/lib/escrow/constants";
import type { EscrowFeeBreakdown, EscrowStatus } from "@/lib/escrow/types";

export function calculateEscrowFees(amountCents: number, shippingCents = 0): EscrowFeeBreakdown {
  const escrowFeeCents = Math.round(amountCents * ESCROW_FEE_RATE);
  return {
    amountCents,
    shippingCents,
    escrowFeeCents,
    totalCents: amountCents + shippingCents + escrowFeeCents,
  };
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function buildEscrowDeadlines(from = new Date()) {
  return {
    payment_deadline: addHours(from, ESCROW_DEADLINES.paymentHours),
    shipping_deadline: addHours(from, ESCROW_DEADLINES.shippingHours),
    confirmation_deadline: addHours(from, ESCROW_DEADLINES.confirmationHours),
    auto_release_at: addDays(from, ESCROW_DEADLINES.autoReleaseDays),
  };
}

export interface CreateEscrowInput {
  shopOrderId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  shippingCents?: number;
  paymentMethod?: "pix" | "stripe" | "credit_card";
}

/** Payload para inserir em escrow_transactions (usar com service role). */
export function buildEscrowInsert(input: CreateEscrowInput) {
  const fees = calculateEscrowFees(input.amountCents, input.shippingCents ?? 0);
  const deadlines = buildEscrowDeadlines();

  return {
    shop_order_id: input.shopOrderId,
    buyer_id: input.buyerId,
    seller_id: input.sellerId,
    amount_cents: fees.amountCents,
    shipping_cents: fees.shippingCents,
    escrow_fee_cents: fees.escrowFeeCents,
    total_cents: fees.totalCents,
    status: "pending_payment" as EscrowStatus,
    payment_method: input.paymentMethod ?? "pix",
    ...deadlines,
    status_history: [
      { to: "pending_payment", at: new Date().toISOString(), note: "escrow_created" },
    ],
  };
}

/** Transições válidas de status. */
const TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  pending_payment: ["payment_received", "cancelled"],
  payment_received: ["shipped", "disputed", "cancelled"],
  shipped: ["delivered", "disputed"],
  delivered: ["released_to_seller", "disputed"],
  disputed: ["resolved"],
  resolved: ["released_to_seller", "refunded_to_buyer"],
  released_to_seller: [],
  refunded_to_buyer: [],
  cancelled: [],
};

export function canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export interface EscrowCronResult {
  expiredPayments: number;
  autoReleased: number;
  shippingReminders: number;
  confirmationReminders: number;
}

/** Lógica de auto-ações — executar via service role no cron. */
export function planEscrowAutoActions(
  rows: Array<{
    id: string;
    status: EscrowStatus;
    payment_deadline: string | null;
    shipping_deadline: string | null;
    confirmation_deadline: string | null;
    auto_release_at: string | null;
  }>,
  now = new Date(),
): {
  cancelIds: string[];
  releaseIds: string[];
  shippingReminderIds: string[];
  confirmationReminderIds: string[];
} {
  const ts = now.getTime();
  const cancelIds: string[] = [];
  const releaseIds: string[] = [];
  const shippingReminderIds: string[] = [];
  const confirmationReminderIds: string[] = [];

  for (const row of rows) {
    if (row.status === "pending_payment" && row.payment_deadline && Date.parse(row.payment_deadline) < ts) {
      cancelIds.push(row.id);
    }
    if (
      (row.status === "delivered" || row.status === "shipped") &&
      row.auto_release_at &&
      Date.parse(row.auto_release_at) < ts
    ) {
      releaseIds.push(row.id);
    }
    if (
      row.status === "payment_received" &&
      row.shipping_deadline &&
      Date.parse(row.shipping_deadline) - ts < 12 * 60 * 60 * 1000 &&
      Date.parse(row.shipping_deadline) > ts
    ) {
      shippingReminderIds.push(row.id);
    }
    if (
      row.status === "shipped" &&
      row.confirmation_deadline &&
      Date.parse(row.confirmation_deadline) - ts < 24 * 60 * 60 * 1000 &&
      Date.parse(row.confirmation_deadline) > ts
    ) {
      confirmationReminderIds.push(row.id);
    }
  }

  return { cancelIds, releaseIds, shippingReminderIds, confirmationReminderIds };
}
