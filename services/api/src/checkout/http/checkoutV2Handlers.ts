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

function toSessionJson(
  session: CheckoutSession,
  extras?: {
    clientSecret?: string | null;
    pix?: {
      qrCodeBase64?: string | null;
      copyPaste?: string | null;
      expiresAt?: string | null;
    } | null;
  },
) {
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
    clientSecret: extras?.clientSecret ?? null,
    pix: extras?.pix ?? null,
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

    // PATCH /api/v1/checkout-v2/cart/:id/items/:listingId
    if (cartItemDel && method === "PATCH") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const quantity = num(body, "quantity");
      if (quantity == null) {
        sendJson(res, 400, { error: "quantity_required" });
        return true;
      }
      const cart = await deps.checkout.updateQuantity({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        cartId: cartItemDel[1]!,
        listingId: cartItemDel[2]!,
        quantity,
      });
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // POST /api/v1/checkout-v2/cart/merge-guest
    if (path === "/api/v1/checkout-v2/cart/merge-guest" && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const guestToken = str(body, "guestToken");
      if (!guestToken) {
        sendJson(res, 400, { error: "guestToken_required" });
        return true;
      }
      const cart = await deps.checkout.mergeGuestCart({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        guestToken,
        targetCartId: str(body, "targetCartId") ?? undefined,
      });
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // POST /api/v1/checkout-v2/cart/merge-user
    if (path === "/api/v1/checkout-v2/cart/merge-user" && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const sourceCartId = str(body, "sourceCartId");
      const targetCartId = str(body, "targetCartId");
      if (!sourceCartId || !targetCartId) {
        sendJson(res, 400, { error: "source_and_target_required" });
        return true;
      }
      const cart = await deps.checkout.mergeUserCart({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        sourceCartId,
        targetCartId,
      });
      sendJson(res, 200, toCartJson(cart));
      return true;
    }

    // POST /api/v1/checkout-v2/cart/:id/validate
    const cartValidate = path.match(/^\/api\/v1\/checkout-v2\/cart\/([^/]+)\/validate$/);
    if (cartValidate && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const result = await deps.checkout.validateItems(user.userId, cartValidate[1]!);
      sendJson(res, result.ok ? 200 : 409, result);
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
      const paymentMethod = str(body, "paymentMethod") === "pix" ? "pix" : "card";
      const result = await deps.checkout.startCheckout({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        cartId,
        couponCode: str(body, "couponCode") ?? undefined,
        idempotencyKey,
        paymentMethod,
      });
      const status = result.status === "failed" ? 409 : 201;
      sendJson(res, status, {
        ...toSessionJson(result.session, {
          clientSecret: result.clientSecret,
          pix: result.pix,
        }),
        sagaId: result.sagaId,
        error: result.error ?? null,
        validationIssues: result.validationIssues ?? [],
      });
      return true;
    }

    // POST /api/v1/checkout-v2/webhooks/:provider (Stripe | mercado_pago | stub)
    const webhookMatch = path.match(/^\/api\/v1\/checkout-v2\/webhooks\/([^/]+)$/);
    if (webhookMatch && method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");
      const result = await deps.checkout.handlePaymentWebhook({
        headers: req.headers as Record<string, string | string[] | undefined>,
        rawBody,
        requestId: getIdGenerator().generate(),
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return true;
    }

    // POST /api/v1/checkout-v2/sessions/:id/expire
    const expireMatch = path.match(/^\/api\/v1\/checkout-v2\/sessions\/([^/]+)\/expire$/);
    if (expireMatch && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const session = await deps.checkout.getSession(expireMatch[1]!, user.userId);
      const expired = await deps.checkout.expireSession(
        session.id,
        getIdGenerator().generate(),
      );
      sendJson(res, 200, toSessionJson(expired));
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

    // POST /api/v1/checkout-v2/sessions/:id/confirm-payment
    const confirmPay = path.match(
      /^\/api\/v1\/checkout-v2\/sessions\/([^/]+)\/confirm-payment$/,
    );
    if (confirmPay && method === "POST") {
      const user = await deps.auth.requireBuyer(req);
      const body = await readJsonBody(req);
      const idempotencyKey =
        (typeof req.headers["idempotency-key"] === "string"
          ? req.headers["idempotency-key"]
          : undefined) ?? str(body, "idempotencyKey") ?? undefined;
      const simulateSuccess =
        body.simulateSuccess === undefined ? true : Boolean(body.simulateSuccess);
      const result = await deps.checkout.confirmPayment({
        requestId: getIdGenerator().generate(),
        buyerId: user.userId,
        sessionId: confirmPay[1]!,
        simulateSuccess,
        clientSecret: str(body, "clientSecret") ?? undefined,
        idempotencyKey,
      });
      const status = result.status === "failed" ? 409 : 200;
      sendJson(res, status, {
        ...toSessionJson(result.session),
        sagaId: result.sagaId,
        confirmedReservationIds: result.confirmedReservationIds,
        error: result.error ?? null,
      });
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
    guest_cart_not_found: 404,
    cart_item_not_found: 404,
    cart_merge_buyer_mismatch: 403,
    cart_merge_same_cart: 400,
    coupon_expired: 400,
    coupon_max_uses: 409,
    coupon_min_value: 400,
    validation_failed: 409,
    checkout_session_not_payable: 409,
    payment_intent_missing: 409,
    reservations_missing: 409,
    payment_not_succeeded: 402,
    reservation_not_held: 409,
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
