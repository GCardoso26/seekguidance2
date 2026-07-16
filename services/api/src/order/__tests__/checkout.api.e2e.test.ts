/**
 * Sprint 5.4/5.5 — Checkout API E2E (async payment via webhook).
 */
import { describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryCheckoutApiStack } from "../createInMemoryCheckoutApiStack.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { fakePaymentSignature } from "../../payment/infrastructure/fake/FakePaymentProvider.js";
import {
  CHECKOUT_PERFORMANCE_BUDGET,
  checkCheckoutBudget,
} from "../../ops/checkoutPerformanceBudget.js";

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  return typeof addr === "object" && addr ? addr.port : 0;
}

async function json(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  headers?: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown>; ms: number }> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const ms = performance.now() - t0;
  const text = await res.text();
  return {
    status: res.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
    ms,
  };
}

async function registerLogin(port: number, email: string, password: string) {
  await json(port, "POST", "/api/v1/auth/register", {
    email,
    displayName: email.split("@")[0],
    password,
  });
  const login = await json(port, "POST", "/api/v1/auth/login", { email, password });
  expect(login.status).toBe(200);
  return login.body.accessToken as string;
}

async function publishActiveListing(
  port: number,
  sellerToken: string,
  priceCents: number,
  quantity = 1,
) {
  await json(
    port,
    "POST",
    "/api/v1/marketplace/sellers",
    { displayName: `Shop ${getIdGenerator().generate().slice(0, 6)}` },
    sellerToken,
  );
  const cardId = getIdGenerator().generate();
  const variantId = getIdGenerator().generate();
  const inv = await json(
    port,
    "POST",
    "/api/v1/marketplace/inventory",
    { catalogCardId: cardId, catalogVariantId: variantId, quantity },
    sellerToken,
  );
  expect(inv.status).toBe(201);
  const listing = await json(
    port,
    "POST",
    "/api/v1/marketplace/listings",
    {
      catalogCardId: cardId,
      catalogVariantId: variantId,
      inventoryItemId: inv.body.id,
      priceCents,
      condition: "NM",
      language: "en",
      quantity,
      status: "active",
    },
    sellerToken,
  );
  expect(listing.status).toBe(201);
  return {
    listingId: listing.body.id as string,
    inventoryItemId: inv.body.id as string,
  };
}

describe("Sprint 5.4/5.5 — checkout.api.e2e", () => {
  it("C1–C6: cart → checkout → pay request → webhook → security", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);

    try {
      const password = "checkout-pass-1!";
      const sellerToken = await registerLogin(
        port,
        `seller-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyerToken = await registerLogin(
        port,
        `buyer-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId } = await publishActiveListing(port, sellerToken, 1500, 2);

      const cartRes = await json(port, "POST", "/api/v1/cart", {}, buyerToken);
      expect(cartRes.status).toBe(201);
      expect(checkCheckoutBudget("createCartMs", cartRes.ms).ok).toBe(true);
      expect(CHECKOUT_PERFORMANCE_BUDGET.createCartMs).toBe(100);
      const cartId = cartRes.body.id as string;

      const addRes = await json(
        port,
        "POST",
        `/api/v1/cart/${cartId}/items`,
        { listingId, quantity: 1 },
        buyerToken,
      );
      expect(addRes.status).toBe(200);
      const items = addRes.body.items as Array<{ priceSnapshotCents: number }>;
      expect(items[0]!.priceSnapshotCents).toBe(1500);

      await json(
        port,
        "PATCH",
        `/api/v1/marketplace/listings/${listingId}`,
        { priceCents: 9999 },
        sellerToken,
      );
      const cartAfter = await json(port, "GET", `/api/v1/cart/${cartId}`, undefined, buyerToken);
      const itemsAfter = cartAfter.body.items as Array<{ priceSnapshotCents: number }>;
      expect(itemsAfter[0]!.priceSnapshotCents).toBe(1500);

      const checkout = await json(
        port,
        "POST",
        "/api/v1/checkout",
        { cartId },
        buyerToken,
      );
      expect(checkout.status).toBe(201);
      expect(checkout.body.status).toBe("CREATED");

      const pay = await json(
        port,
        "POST",
        `/api/v1/checkout/${checkout.body.checkoutSessionId}/pay`,
        {},
        buyerToken,
      );
      expect(pay.status).toBe(200);
      expect(checkCheckoutBudget("payFakeMs", pay.ms).ok).toBe(true);
      expect(pay.body.paymentStatus).toBe("REQUESTED");
      expect(pay.body.status).toBe("PAYMENT_PENDING");
      const pendingOrder = pay.body.order as { status: string; totalAmountCents: number };
      expect(pendingOrder.status).toBe("PENDING");
      expect(pendingOrder.totalAmountCents).toBe(1500);

      const paymentId = pay.body.paymentId as string;
      const wh = await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.approved",
          paymentId,
          idempotencyKey: `gp-${paymentId}`,
        },
        undefined,
        { "X-Payment-Signature": fakePaymentSignature(paymentId) },
      );
      expect(wh.status).toBe(200);
      expect(wh.body.orderStatus).toBe("PAID");

      const orderId = checkout.body.orderId as string;
      const getOrder = await json(port, "GET", `/api/v1/orders/${orderId}`, undefined, buyerToken);
      expect(getOrder.status).toBe(200);
      expect(getOrder.body.status).toBe("PAID");

      const buyerB = await registerLogin(
        port,
        `buyerB-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const forbidden = await json(port, "GET", `/api/v1/orders/${orderId}`, undefined, buyerB);
      expect(forbidden.status).toBe(403);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("C5 declined via webhook → reservation released · order cancelled", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);

    try {
      const password = "checkout-pass-2!";
      const sellerToken = await registerLogin(
        port,
        `s-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyerToken = await registerLogin(
        port,
        `b-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId, inventoryItemId } = await publishActiveListing(
        port,
        sellerToken,
        800,
        1,
      );

      const cart = await json(port, "POST", "/api/v1/cart", {}, buyerToken);
      await json(
        port,
        "POST",
        `/api/v1/cart/${cart.body.id}/items`,
        { listingId, quantity: 1 },
        buyerToken,
      );
      const checkout = await json(
        port,
        "POST",
        "/api/v1/checkout",
        { cartId: cart.body.id },
        buyerToken,
      );
      const pay = await json(
        port,
        "POST",
        `/api/v1/checkout/${checkout.body.checkoutSessionId}/pay`,
        {},
        buyerToken,
      );
      const paymentId = pay.body.paymentId as string;
      const wh = await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.declined",
          paymentId,
          idempotencyKey: `dec-${paymentId}`,
        },
        undefined,
        { "X-Payment-Signature": fakePaymentSignature(paymentId) },
      );
      expect(wh.body.orderStatus).toBe("CANCELLED");
      expect(
        await stack.order.tx.runInTransaction((t) =>
          stack.order.reservations.heldQuantityForInventory(t, inventoryItemId),
        ),
      ).toBe(0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
