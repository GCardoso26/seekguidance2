import type { IncomingMessage, ServerResponse } from "node:http";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { AuthError, type AuthMiddleware } from "../../identity/http/authMiddleware.js";
import { num, readJsonBody, sendJson, str } from "../../identity/http/httpHelpers.js";
import type { CheckoutService } from "../application/CheckoutService.js";
import type { Cart, CheckoutSession } from "../domain/types.js";

export interface CheckoutV2HttpDeps {
  auth: AuthMiddleware;
  checkout: CheckoutService;
}

function toCartJson(cart: Cart) {
  return {
    id: cart.id,
    buyerId: cart.buyerId,
    status: cart.status,
    items: cart.items.map((i) => ({
      id: i.id,
      listingId: i.listingId,
      productVariantId: i.productVariantId,
      catalogVariantId: i.catalogVariantId,
      quantity: i.quantity,
      priceSnapshotCents: i.priceSnapshotCents,
      currency: i.currency,
    })),
  };
}

function toSessionJson(session: CheckoutSession, clientSecret?: string | null) {
  return {
    id: session.id,
    cartId: session.cartId,
    status: session.status,
    couponCode: session.couponCode,
    subtotalCents: session.subtotalCents,
    discountCents: session.discountCents,
    totalCents: session.totalCents,
    currency: session.currency,
    sagaId: session.sagaId,
    paymentIntentId: session.paymentIntentId,
    clientSecret: clientSecret ?? null,
    error: session.error,
  };
}

/**
 * Checkout BC V2 HTTP — gated by feature flag checkout_v2 inside CheckoutService.
 * Routes under /api/v1/checkout-v2 to avoid colliding with legacy Order checkout.
 */
export async function handleCheckoutV2Api(
  deps: CheckoutV2HttpDeps,
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
): Promise<boolean> {
  if (!path.startsWith("/api/v1/checkout-v2")) return false;

  try {
    // POST /api/v1/checkout-v2/cart
    if (path === "/api/v1/checkout-v2/cart" && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const cart = await deps.checkout.getOrCreateCart(user.userId);
      sendJson(res, 201, toCartJson(cart));
      return true;
    }

    // GET /api/v1/checkout-v2/cart/:id
    const cartGet = path.match(/^\/api\/v1\/checkout-v2\/cart\/([^/]+)$/);
    if (cartGet && method === "GET") {
      const user = await deps.auth.requireBuyer(req);
      const cart = await deps.checkout.getCart(cartGet[1]!, user.userId);
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // POST /api/v1/checkout-v2/cart/:id/items
    const cartItems = path.match(/^\/api\/v1\/checkout-v2\/cart\/([^/]+)\/items$/);
    if (cartItems && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const listingId = str(body, "listingId");
      if (!listingId) {
        sendJson(res, 400, { error: "listingId_required" });
        return true;
      }
      const cart = await deps.checkout.addToCart({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        cartId: cartItems[1]!,
        listingId,
        quantity: num(body, "quantity") ?? 1,
      });
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // DELETE /api/v1/checkout-v2/cart/:id/items/:listingId
    const cartItemDel = path.match(
      /^\/api\/v1\/checkout-v2\/cart\/([^/]+)\/items\/([^/]+)$/,
    );
    if (cartItemDel && method === "DELETE") {
      const user = await deps.auth.requireBuyer(req);
      const cart = await deps.checkout.removeFromCart(
        user.userId,
        cartItemDel[1]!,
        cartItemDel[2]!,
      );
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // POST /api/v1/checkout-v2/sessions
    if (path === "/api/v1/checkout-v2/sessions" && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const cartId = str(body, "cartId");
      if (!cartId) {
        sendJson(res, 400, { error: "cartId_required" });
        return true;
      }
      const idempotencyKey =
        (typeof req.headers["idempotency-key"] === "string"
          ? req.headers["idempotency-key"]
          : undefined) ?? str(body, "idempotencyKey") ?? undefined;
      const result = await deps.checkout.startCheckout({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        cartId,
        couponCode: str(body, "couponCode") ?? undefined,
        idempotencyKey,
      });
      const status = result.status === "failed" ? 409 : 201;
      sendJson(res, status, {
        ...toSessionJson(result.session, result.clientSecret),
        sagaId: result.sagaId,
        error: result.error ?? null,
      });
      return true;
    }

    // GET /api/v1/checkout-v2/sessions/:id
    const sessionGet = path.match(/^\/api\/v1\/checkout-v2\/sessions\/([^/]+)$/);
    if (sessionGet && method === "GET") {
      const user = await deps.auth.requireBuyer(req);
      const session = await deps.checkout.getSession(sessionGet[1]!, user.userId);
      sendJson(res, 200, toSessionJson(session));
      return true;
    }

    return false;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    const mapped = mapCheckoutV2Error(message);
    sendJson(res, mapped.status, { error: mapped.code });
    return true;
  }
}

export function mapCheckoutV2Error(message: string): { status: number; code: string } {
  const codes: Record<string, number> = {
    checkout_v2_disabled: 403,
    cart_not_found: 404,
    cart_buyer_mismatch: 403,
    cart_not_open: 409,
    cart_empty: 400,
    listing_not_found: 404,
    listing_not_active: 409,
    listing_insufficient_qty: 409,
    quantity_invalid: 400,
    coupon_invalid: 400,
    checkout_session_not_found: 404,
    checkout_buyer_mismatch: 403,
    stock_unit_missing: 409,
    insufficient_stock: 409,
  };
  for (const [code, status] of Object.entries(codes)) {
    if (message === code || message.startsWith(`${code}:`)) {
      return { status, code: message.split(":")[0]! };
    }
  }
  return { status: 500, code: "checkout_v2_error" };
}
