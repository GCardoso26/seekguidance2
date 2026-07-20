export type CartStatus = "open" | "checked_out" | "abandoned";

export type CheckoutSessionStatus =
  | "created"
  | "validating"
  | "reserved"
  | "priced"
  | "payment_pending"
  | "completed"
  | "failed"
  | "cancelled";

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

export function applyCouponDiscount(
  subtotalCents: number,
  coupon: Coupon | null,
): { discountCents: number; totalCents: number } {
  if (!coupon || !coupon.active) {
    return { discountCents: 0, totalCents: subtotalCents };
  }
  let discount = 0;
  if (coupon.percentOff != null) {
    discount = Math.floor((subtotalCents * coupon.percentOff) / 100);
  } else if (coupon.amountOffCents != null) {
    discount = Math.min(coupon.amountOffCents, subtotalCents);
  }
  return { discountCents: discount, totalCents: Math.max(0, subtotalCents - discount) };
}
