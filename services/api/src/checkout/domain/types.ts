export type CartStatus = "open" | "checked_out" | "abandoned";

export type CheckoutSessionStatus =
  | "created"
  | "validating"
  | "reserved"
  | "priced"
  | "payment_pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface CartItem {
  id: string;
  cartId: string;
  listingId: string;
  productVariantId: string | null;
  catalogVariantId: string | null;
  sellerId: string | null;
  stockUnitId: string | null;
  quantity: number;
  priceSnapshotCents: number;
  currency: string;
}

export interface Cart {
  id: string;
  buyerId: string;
  status: CartStatus;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  guestToken?: string | null;
}

export interface CheckoutSession {
  id: string;
  cartId: string;
  buyerId: string;
  status: CheckoutSessionStatus;
  couponCode: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  sagaId: string | null;
  paymentIntentId: string | null;
  reservationIds: string[];
  pricingSnapshot: Record<string, unknown>;
  idempotencyKey: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  active: boolean;
}

export function cartSubtotalCents(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.priceSnapshotCents * i.quantity, 0);
}

export { applyCouponDiscount } from "./CouponEngine.js";
