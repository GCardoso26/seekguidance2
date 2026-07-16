import type { IncomingMessage, ServerResponse } from "node:http";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { AuthError, type AuthMiddleware } from "../../identity/http/authMiddleware.js";
import { num, readJsonBody, sendJson, str } from "../../identity/http/httpHelpers.js";
import type { MarketplaceQueryService } from "../../marketplace/read/MarketplaceQueryService.js";
import type { CreateCartApplicationService } from "../application/CartApplicationServices.js";
import type { AddCartItemApplicationService } from "../application/CartApplicationServices.js";
import type { RemoveCartItemApplicationService } from "../application/CartApplicationServices.js";
import type { StartCheckoutApplicationService } from "../application/StartCheckoutApplicationService.js";
import type { PayCheckoutApplicationService } from "../application/PayCheckoutApplicationService.js";
import type { CartRepository } from "../domain/CartRepository.js";
import type { OrderRepository } from "../domain/OrderRepository.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import {
  toCartResponse,
  toCheckoutResponse,
  toOrderDetailsResponse,
  toOrderSummaryResponse,
  toPayCheckoutResponse,
} from "../api/mappers.js";

export interface CheckoutHttpDeps {
  auth: AuthMiddleware;
  orderTx: TransactionManager;
  carts: CartRepository;
  orders: OrderRepository;
  queries: MarketplaceQueryService;
  createCart: CreateCartApplicationService;
  addCartItem: AddCartItemApplicationService;
  removeCartItem: RemoveCartItemApplicationService;
  startCheckout: StartCheckoutApplicationService;
  payCheckout: PayCheckoutApplicationService;
}

/**
 * Thin HTTP handlers for Checkout API (Sprint 5.4).
 * Returns true when the request was handled.
 */
export async function handleCheckoutApi(
  deps: CheckoutHttpDeps,
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
): Promise<boolean> {
  // POST /api/v1/cart
  if (path === "/api/v1/cart" && method === "POST") {
    const user = await deps.auth.requireBuyer(req);
    const cart = await deps.createCart.execute({
      requestId: getIdGenerator().generate(),
      buyerId: user.userId,
    });
    sendJson(res, 201, toCartResponse(cart));
    return true;
  }

  // GET /api/v1/cart/:id
  const cartGet = path.match(/^\/api\/v1\/cart\/([^/]+)$/);
  if (cartGet && method === "GET") {
    const user = await deps.auth.requireBuyer(req);
    const cartId = cartGet[1]!;
    const cart = await deps.orderTx.runInTransaction((t) => deps.carts.findById(t, cartId));
    if (!cart) {
      sendJson(res, 404, { error: "cart_not_found" });
      return true;
    }
    if (cart.buyerId !== user.userId) {
      throw new AuthError("forbidden", 403, "forbidden");
    }
    sendJson(res, 200, toCartResponse(cart));
    return true;
  }

  // POST /api/v1/cart/:id/items
  const cartItems = path.match(/^\/api\/v1\/cart\/([^/]+)\/items$/);
  if (cartItems && method === "POST") {
    const user = await deps.auth.requireBuyer(req);
    const cartId = cartItems[1]!;
    const body = await readJsonBody(req);
    const listingId = str(body, "listingId");
    const quantity = num(body, "quantity") ?? 1;
    if (!listingId) {
      sendJson(res, 400, { error: "listing_id_required" });
      return true;
    }
    if (quantity <= 0) {
      sendJson(res, 400, { error: "quantity_invalid" });
      return true;
    }

    const cart = await deps.orderTx.runInTransaction((t) => deps.carts.findById(t, cartId));
    if (!cart) {
      sendJson(res, 404, { error: "cart_not_found" });
      return true;
    }
    if (cart.buyerId !== user.userId) {
      throw new AuthError("forbidden", 403, "forbidden");
    }

    const listing = await deps.queries.getListing(listingId);
    if (!listing || listing.status !== "active") {
      sendJson(res, 400, { error: "listing_unavailable" });
      return true;
    }

    const updated = await deps.addCartItem.execute({
      requestId: getIdGenerator().generate(),
      cartId,
      item: {
        listingId: listing.id,
        catalogVariantId: listing.catalogVariantId,
        quantity,
        priceSnapshotCents: listing.priceCents,
        currency: listing.currency,
      },
    });
    sendJson(res, 200, toCartResponse(updated));
    return true;
  }

  // DELETE /api/v1/cart/:id/items/:itemId
  const cartItemDel = path.match(/^\/api\/v1\/cart\/([^/]+)\/items\/([^/]+)$/);
  if (cartItemDel && method === "DELETE") {
    const user = await deps.auth.requireBuyer(req);
    const cartId = cartItemDel[1]!;
    const itemId = cartItemDel[2]!;
    const cart = await deps.orderTx.runInTransaction((t) => deps.carts.findById(t, cartId));
    if (!cart) {
      sendJson(res, 404, { error: "cart_not_found" });
      return true;
    }
    if (cart.buyerId !== user.userId) {
      throw new AuthError("forbidden", 403, "forbidden");
    }
    const updated = await deps.removeCartItem.execute(cartId, itemId);
    sendJson(res, 200, toCartResponse(updated));
    return true;
  }

  // POST /api/v1/checkout
  if (path === "/api/v1/checkout" && method === "POST") {
    const user = await deps.auth.requireBuyer(req);
    const body = await readJsonBody(req);
    const cartId = str(body, "cartId");
    if (!cartId) {
      sendJson(res, 400, { error: "cart_id_required" });
      return true;
    }
    const { session } = await deps.startCheckout.execute({
      requestId: getIdGenerator().generate(),
      cartId,
      buyerId: user.userId,
    });
    sendJson(res, 201, toCheckoutResponse(session));
    return true;
  }

  // POST /api/v1/checkout/:id/pay
  const checkoutPay = path.match(/^\/api\/v1\/checkout\/([^/]+)\/pay$/);
  if (checkoutPay && method === "POST") {
    const user = await deps.auth.requireBuyer(req);
    const checkoutSessionId = checkoutPay[1]!;
    const result = await deps.payCheckout.execute({
      requestId: getIdGenerator().generate(),
      checkoutSessionId,
      buyerId: user.userId,
    });
    sendJson(res, 200, toPayCheckoutResponse(
      result.session,
      result.order,
      result.payment,
      result.providerTimeout,
    ));
    return true;
  }

  // GET /api/v1/orders
  if (path === "/api/v1/orders" && method === "GET") {
    const user = await deps.auth.requireBuyer(req);
    // Never accept ?buyerId= from client — always currentUser.
    const orders = await deps.orderTx.runInTransaction((t) =>
      deps.orders.listByBuyer(t, user.userId),
    );
    sendJson(res, 200, { orders: orders.map(toOrderSummaryResponse) });
    return true;
  }

  // GET /api/v1/orders/:id
  const orderGet = path.match(/^\/api\/v1\/orders\/([^/]+)$/);
  if (orderGet && method === "GET") {
    const user = await deps.auth.requireBuyer(req);
    const orderId = orderGet[1]!;
    const order = await deps.orderTx.runInTransaction((t) =>
      deps.orders.findById(t, orderId),
    );
    if (!order) {
      sendJson(res, 404, { error: "order_not_found" });
      return true;
    }
    if (order.buyerId !== user.userId) {
      throw new AuthError("forbidden", 403, "forbidden");
    }
    sendJson(res, 200, toOrderDetailsResponse(order));
    return true;
  }

  return false;
}

/** Map domain errors to HTTP for checkout handlers. */
export function mapCheckoutDomainError(message: string): { status: number; error: string } | null {
  const map: Record<string, { status: number; error: string }> = {
    cart_not_found: { status: 404, error: "cart_not_found" },
    cart_buyer_mismatch: { status: 403, error: "forbidden" },
    cart_not_open: { status: 409, error: "cart_not_open" },
    cart_empty: { status: 400, error: "cart_empty" },
    checkout_not_found: { status: 404, error: "checkout_not_found" },
    checkout_forbidden: { status: 403, error: "forbidden" },
    checkout_not_payable: { status: 409, error: "checkout_not_payable" },
    checkout_missing_order: { status: 409, error: "checkout_missing_order" },
    order_not_found: { status: 404, error: "order_not_found" },
    order_not_pending: { status: 409, error: "order_not_pending" },
    listing_unavailable: { status: 400, error: "listing_unavailable" },
    listing_missing_inventory: { status: 400, error: "listing_missing_inventory" },
  };
  if (map[message]) return map[message]!;
  if (message.startsWith("reservation_rejected:")) {
    return { status: 409, error: message };
  }
  return null;
}
