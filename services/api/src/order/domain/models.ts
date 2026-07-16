/**
 * Order domain models (Sprint 5.1) — financial bounded context.
 * Marketplace sells; Order buys. See ORDER_DOMAIN.md.
 *
 * Inviolable:
 *  - Price is snapshot (never re-read Listing after checkout).
 *  - Reservation before payment (never pay then hunt stock).
 *  - Order never mutates Listing.
 */

export type CartStatus = "open" | "checked_out" | "abandoned";

export interface CartItem {
  id: string;
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  /** Frozen at add/checkout — never re-fetched from Listing. */
  priceSnapshotCents: number;
  currency: "BRL";
}

export interface Cart {
  id: string;
  buyerId: string;
  status: CartStatus;
  items: CartItem[];
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CheckoutStatus =
  | "CREATED"
  | "VALIDATING"
  | "RESERVED"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "FAILED";

export interface CheckoutSession {
  id: string;
  cartId: string;
  buyerId: string;
  status: CheckoutStatus;
  orderId: string | null;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "FULFILLED";

export interface OrderItem {
  id: string;
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  unitPriceCents: number;
  currency: "BRL";
}

export interface Order {
  id: string;
  buyerId: string;
  checkoutSessionId: string;
  status: OrderStatus;
  totalAmountCents: number;
  currency: "BRL";
  items: OrderItem[];
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationStatus = "HELD" | "CONFIRMED" | "RELEASED" | "EXPIRED";

export interface InventoryReservation {
  id: string;
  listingId: string;
  inventoryItemId: string;
  buyerId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentIntentStatus =
  | "pending"
  | "approved"
  | "declined"
  | "timeout";

/** Payment knows only amount/currency/status — never Marketplace. */
export interface PaymentIntent {
  id: string;
  amountCents: number;
  currency: "BRL";
  status: PaymentIntentStatus;
  externalRef: string | null;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function cartTotalCents(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.priceSnapshotCents * i.quantity, 0);
}

export function orderTotalFromItems(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}
