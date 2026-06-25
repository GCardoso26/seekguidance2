export type EscrowStatus =
  | "pending_payment"
  | "payment_received"
  | "shipped"
  | "delivered"
  | "disputed"
  | "resolved"
  | "released_to_seller"
  | "refunded_to_buyer"
  | "cancelled";

export interface EscrowTransaction {
  id: string;
  shop_order_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  shipping_cents: number;
  escrow_fee_cents: number;
  total_cents: number;
  status: EscrowStatus;
  payment_method: string;
  payment_deadline: string | null;
  shipping_deadline: string | null;
  confirmation_deadline: string | null;
  auto_release_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowFeeBreakdown {
  amountCents: number;
  shippingCents: number;
  escrowFeeCents: number;
  totalCents: number;
}
