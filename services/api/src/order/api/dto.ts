/** Public Checkout API DTOs — never serialize domain aggregates. */

export interface CartItemResponse {
  id: string;
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  priceSnapshotCents: number;
  currency: "BRL";
}

export interface CartResponse {
  id: string;
  status: "open" | "checked_out" | "abandoned";
  items: CartItemResponse[];
  totalCents: number;
  currency: "BRL";
}

export interface CheckoutResponse {
  checkoutSessionId: string;
  status: string;
  orderId: string | null;
  cartId: string;
}

export interface OrderItemResponse {
  id: string;
  listingId: string;
  catalogVariantId: string;
  quantity: number;
  unitPriceCents: number;
  currency: "BRL";
}

export interface OrderSummaryResponse {
  id: string;
  status: string;
  totalAmountCents: number;
  currency: "BRL";
  itemCount: number;
  createdAt: string;
}

export interface OrderDetailsResponse {
  id: string;
  status: string;
  totalAmountCents: number;
  currency: "BRL";
  checkoutSessionId: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PayCheckoutResponse {
  checkoutSessionId: string;
  status: string;
  order: OrderDetailsResponse;
  paymentId: string;
  paymentStatus: string;
  providerTimeout: boolean;
}
