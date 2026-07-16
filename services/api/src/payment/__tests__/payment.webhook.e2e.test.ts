/**
 * Sprint 5.5 — Payment webhook E2E (Fake provider simulation).
 */
import { describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryCheckoutApiStack } from "../../order/createInMemoryCheckoutApiStack.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { fakePaymentSignature } from "../infrastructure/fake/FakePaymentProvider.js";

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
): Promise<{ status: number; body: Record<string, unknown> }> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return {
    status: res.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
  };
}

async function registerLogin(port: number, email: string, password: string) {
  await json(port, "POST", "/api/v1/auth/register", {
    email,
    displayName: email.split("@")[0],
    password,
  });
  const login = await json(port, "POST", "/api/v1/auth/login", { email, password });
  return login.body.accessToken as string;
}

async function setupListing(port: number, sellerToken: string, qty = 1) {
  await json(
    port,
    "POST",
    "/api/v1/marketplace/sellers",
    { displayName: `PayShop ${getIdGenerator().generate().slice(0, 4)}` },
    sellerToken,
  );
  const cardId = getIdGenerator().generate();
  const variantId = getIdGenerator().generate();
  const inv = await json(
    port,
    "POST",
    "/api/v1/marketplace/inventory",
    { catalogCardId: cardId, catalogVariantId: variantId, quantity: qty },
    sellerToken,
  );
  const listing = await json(
    port,
    "POST",
    "/api/v1/marketplace/listings",
    {
      catalogCardId: cardId,
      catalogVariantId: variantId,
      inventoryItemId: inv.body.id,
      priceCents: 1200,
      condition: "NM",
      quantity: qty,
      status: "active",
    },
    sellerToken,
  );
  return {
    listingId: listing.body.id as string,
    inventoryItemId: inv.body.id as string,
  };
}

async function checkoutUntilPay(
  port: number,
  buyerToken: string,
  listingId: string,
) {
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
  return { checkout, pay };
}

describe("Sprint 5.5 — payment.webhook.e2e", () => {
  it("C1 — approved webhook → Payment AUTHORIZED · Order PAID", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);
    const password = "pay-e2e-1!";
    try {
      const seller = await registerLogin(
        port,
        `s-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyer = await registerLogin(
        port,
        `b-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId } = await setupListing(port, seller);
      const { pay } = await checkoutUntilPay(port, buyer, listingId);
      expect(pay.status).toBe(200);
      expect(pay.body.paymentStatus).toBe("REQUESTED");
      expect(pay.body.status).toBe("PAYMENT_PENDING");
      const order = pay.body.order as { status: string };
      expect(order.status).toBe("PENDING");

      const paymentId = pay.body.paymentId as string;
      const wh = await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.approved",
          paymentId,
          idempotencyKey: `c1-${paymentId}`,
        },
        undefined,
        { "X-Payment-Signature": fakePaymentSignature(paymentId) },
      );
      expect(wh.status).toBe(200);
      expect(wh.body.paymentStatus).toBe("AUTHORIZED");
      expect(wh.body.orderStatus).toBe("PAID");

      const claimed = await stack.payment.outbox.claimBatch({
        workerId: "w",
        leaseMs: 5_000,
        limit: 50,
      });
      expect(claimed.some((r) => r.eventName === "PaymentApproved")).toBe(true);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("C2 — declined → FAILED · reservation RELEASED · Order CANCELLED", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);
    const password = "pay-e2e-2!";
    try {
      const seller = await registerLogin(
        port,
        `s2-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyer = await registerLogin(
        port,
        `b2-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId, inventoryItemId } = await setupListing(port, seller, 1);
      const { pay } = await checkoutUntilPay(port, buyer, listingId);
      const paymentId = pay.body.paymentId as string;

      const wh = await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.declined",
          paymentId,
          idempotencyKey: `c2-${paymentId}`,
        },
        undefined,
        { "X-Payment-Signature": fakePaymentSignature(paymentId) },
      );
      expect(wh.body.paymentStatus).toBe("FAILED");
      expect(wh.body.orderStatus).toBe("CANCELLED");

      const held = await stack.order.tx.runInTransaction((t) =>
        stack.order.reservations.heldQuantityForInventory(t, inventoryItemId),
      );
      expect(held).toBe(0);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("C3 — duplicate approved webhook → 1 PaymentApproved semantics", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);
    const password = "pay-e2e-3!";
    try {
      const seller = await registerLogin(
        port,
        `s3-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyer = await registerLogin(
        port,
        `b3-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId } = await setupListing(port, seller);
      const { pay } = await checkoutUntilPay(port, buyer, listingId);
      const paymentId = pay.body.paymentId as string;
      const key = `c3-dup-${paymentId}`;
      const sig = { "X-Payment-Signature": fakePaymentSignature(paymentId) };
      const body = {
        provider: "fake",
        event: "payment.approved",
        paymentId,
        idempotencyKey: key,
      };

      const first = await json(port, "POST", "/api/v1/payments/webhook", body, undefined, sig);
      const second = await json(port, "POST", "/api/v1/payments/webhook", body, undefined, sig);
      expect(first.body.duplicate).toBe(false);
      expect(second.body.duplicate).toBe(true);
      expect(second.body.paymentStatus).toBe("AUTHORIZED");

      const claimed = await stack.payment.outbox.claimBatch({
        workerId: "w",
        leaseMs: 5_000,
        limit: 50,
      });
      const approved = claimed.filter((r) => r.eventName === "PaymentApproved");
      expect(approved).toHaveLength(1);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("C4 — out-of-order approved then failed → stays AUTHORIZED", async () => {
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);
    const password = "pay-e2e-4!";
    try {
      const seller = await registerLogin(
        port,
        `s4-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyer = await registerLogin(
        port,
        `b4-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId } = await setupListing(port, seller);
      const { pay } = await checkoutUntilPay(port, buyer, listingId);
      const paymentId = pay.body.paymentId as string;
      const sig = { "X-Payment-Signature": fakePaymentSignature(paymentId) };

      await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.approved",
          paymentId,
          idempotencyKey: `c4-ok-${paymentId}`,
        },
        undefined,
        sig,
      );
      const failed = await json(
        port,
        "POST",
        "/api/v1/payments/webhook",
        {
          provider: "fake",
          event: "payment.failed",
          paymentId,
          idempotencyKey: `c4-fail-${paymentId}`,
        },
        undefined,
        sig,
      );
      expect(failed.body.paymentStatus).toBe("AUTHORIZED");
      expect(failed.body.outcome).toBe("ignored");
      expect(failed.body.orderStatus).toBe("PAID");
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("C5 — provider timeout → PAYMENT_PENDING · no auto-cancel", async () => {
    const stack = createInMemoryCheckoutApiStack({ paymentMode: "timeout" });
    const server = stack.createServer();
    const port = await listen(server);
    const password = "pay-e2e-5!";
    try {
      const seller = await registerLogin(
        port,
        `s5-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const buyer = await registerLogin(
        port,
        `b5-${getIdGenerator().generate().slice(0, 8)}@ex.com`,
        password,
      );
      const { listingId } = await setupListing(port, seller);
      const { pay } = await checkoutUntilPay(port, buyer, listingId);
      expect(pay.body.providerTimeout).toBe(true);
      expect(pay.body.status).toBe("PAYMENT_PENDING");
      expect(pay.body.paymentStatus).toBe("REQUESTED");
      const order = pay.body.order as { status: string };
      expect(order.status).toBe("PENDING");
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
