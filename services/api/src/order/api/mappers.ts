import { cartTotalCents, type Cart, type CheckoutSession, type Order } from "../domain/models.js";
import type {
  CartItemResponse,
  CartResponse,
  CheckoutResponse,
  OrderDetailsResponse,
  OrderSummaryResponse,
  PayCheckoutResponse,
} from "./dto.js";

export function toCartResponse(cart: Cart): CartResponse {
  const items: CartItemResponse[] = cart.items.map((i) => ({
    id: i.id,
    listingId: i.listingId,
    catalogVariantId: i.catalogVariantId,
    quantity: i.quantity,
    priceSnapshotCents: i.priceSnapshotCents,
    currency: i.currency,
  }));
  return {
    id: cart.id,
    status: cart.status,
    items,
    totalCents: cartTotalCents(cart),
    currency: "BRL",
  };
}

export function toCheckoutResponse(session: CheckoutSession): CheckoutResponse {
  return {
    checkoutSessionId: session.id,
    status: session.status,
    orderId: session.orderId,
    cartId: session.cartId,
  };
}

export function toOrderSummaryResponse(order: Order): OrderSummaryResponse {
  return {
    id: order.id,
    status: order.status,
    totalAmountCents: order.totalAmountCents,
    currency: order.currency,
    itemCount: order.items.length,
    createdAt: order.createdAt.toISOString(),
  };
}

export function toOrderDetailsResponse(order: Order): OrderDetailsResponse {
  return {
    id: order.id,
    status: order.status,
    totalAmountCents: order.totalAmountCents,
    currency: order.currency,
    checkoutSessionId: order.checkoutSessionId,
    items: order.items.map((i) => ({
      id: i.id,
      listingId: i.listingId,
      catalogVariantId: i.catalogVariantId,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      currency: i.currency,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toPayCheckoutResponse(
  session: CheckoutSession,
  order: Order,
  payment: { id: string; status: string },
  providerTimeout: boolean,
): PayCheckoutResponse {
  return {
    checkoutSessionId: session.id,
    status: session.status,
    order: toOrderDetailsResponse(order),
    paymentId: payment.id,
    paymentStatus: payment.status,
    providerTimeout,
  };
}
