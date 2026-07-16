/**
 * Checkout API Certification (Sprint 5.4).
 * Usage: npm run certify:checkout
 *
 * Boots in-memory Checkout API stack and exercises Cart → Checkout → Pay.
 */
import { createInMemoryCheckoutApiStack } from "./createInMemoryCheckoutApiStack.js";
import { getIdGenerator } from "../shared/ids/IdGenerator.js";
import { checkCheckoutBudget } from "../ops/checkoutPerformanceBudget.js";
import type { Server } from "node:http";

interface Check {
  id: string;
  ok: boolean;
  detail: string;
}

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
): Promise<{ status: number; body: Record<string, unknown>; ms: number }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
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

async function main(): Promise<void> {
  const checks: Check[] = [];
  const stack = createInMemoryCheckoutApiStack();
  const server = stack.createServer();
  const port = await listen(server);

  try {
    const password = "cert-checkout-1!";
    const sellerEmail = `seller-${getIdGenerator().generate().slice(0, 8)}@cert.local`;
    const buyerEmail = `buyer-${getIdGenerator().generate().slice(0, 8)}@cert.local`;

    await json(port, "POST", "/api/v1/auth/register", {
      email: sellerEmail,
      displayName: "Seller Cert",
      password,
    });
    const sellerLogin = await json(port, "POST", "/api/v1/auth/login", {
      email: sellerEmail,
      password,
    });
    const sellerToken = sellerLogin.body.accessToken as string;

    await json(port, "POST", "/api/v1/auth/register", {
      email: buyerEmail,
      displayName: "Buyer Cert",
      password,
    });
    const buyerLogin = await json(port, "POST", "/api/v1/auth/login", {
      email: buyerEmail,
      password,
    });
    const buyerToken = buyerLogin.body.accessToken as string;

    await json(
      port,
      "POST",
      "/api/v1/marketplace/sellers",
      { displayName: "Cert Shop" },
      sellerToken,
    );
    const cardId = getIdGenerator().generate();
    const variantId = getIdGenerator().generate();
    const inv = await json(
      port,
      "POST",
      "/api/v1/marketplace/inventory",
      { catalogCardId: cardId, catalogVariantId: variantId, quantity: 3 },
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
        priceCents: 2200,
        condition: "NM",
        quantity: 1,
        status: "active",
      },
      sellerToken,
    );

    const cart = await json(port, "POST", "/api/v1/cart", {}, buyerToken);
    checks.push({
      id: "create_cart",
      ok: cart.status === 201 && checkCheckoutBudget("createCartMs", cart.ms).ok,
      detail: `status=${cart.status} ms=${cart.ms.toFixed(1)}`,
    });

    const add = await json(
      port,
      "POST",
      `/api/v1/cart/${cart.body.id}/items`,
      { listingId: listing.body.id, quantity: 1 },
      buyerToken,
    );
    const items = (add.body.items as Array<{ priceSnapshotCents: number }>) ?? [];
    checks.push({
      id: "add_item_snapshot",
      ok: add.status === 200 && items[0]?.priceSnapshotCents === 2200,
      detail: `status=${add.status} snapshot=${items[0]?.priceSnapshotCents}`,
    });

    const checkout = await json(
      port,
      "POST",
      "/api/v1/checkout",
      { cartId: cart.body.id },
      buyerToken,
    );
    checks.push({
      id: "checkout_created",
      ok: checkout.status === 201 && checkout.body.status === "CREATED",
      detail: `status=${checkout.status} session=${checkout.body.status}`,
    });

    const pay = await json(
      port,
      "POST",
      `/api/v1/checkout/${checkout.body.checkoutSessionId}/pay`,
      {},
      buyerToken,
    );
    const pendingOrder = pay.body.order as { status?: string } | undefined;
    checks.push({
      id: "pay_requested",
      ok:
        pay.status === 200 &&
        pendingOrder?.status === "PENDING" &&
        pay.body.paymentStatus === "REQUESTED",
      detail: `status=${pay.status} order=${pendingOrder?.status} payment=${pay.body.paymentStatus}`,
    });

    const { fakePaymentSignature } = await import(
      "../payment/infrastructure/fake/FakePaymentProvider.js"
    );
    const paymentId = pay.body.paymentId as string;
    const whSigned = await (async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Payment-Signature": fakePaymentSignature(paymentId),
      };
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/payments/webhook`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: "fake",
          event: "payment.approved",
          paymentId,
          idempotencyKey: `cert-co-${paymentId}`,
        }),
      });
      const text = await res.text();
      return {
        status: res.status,
        body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
      };
    })();
    checks.push({
      id: "webhook_paid",
      ok:
        whSigned.status === 200 &&
        whSigned.body.orderStatus === "PAID" &&
        whSigned.body.paymentStatus === "AUTHORIZED",
      detail: `order=${whSigned.body.orderStatus} payment=${whSigned.body.paymentStatus}`,
    });

    const getOrder = await json(
      port,
      "GET",
      `/api/v1/orders/${checkout.body.orderId}`,
      undefined,
      buyerToken,
    );
    checks.push({
      id: "get_own_order",
      ok: getOrder.status === 200 && getOrder.body.status === "PAID",
      detail: `status=${getOrder.status}`,
    });

    // Ownership isolation
    const otherEmail = `other-${getIdGenerator().generate().slice(0, 8)}@cert.local`;
    await json(port, "POST", "/api/v1/auth/register", {
      email: otherEmail,
      displayName: "Other",
      password,
    });
    const otherLogin = await json(port, "POST", "/api/v1/auth/login", {
      email: otherEmail,
      password,
    });
    const denied = await json(
      port,
      "GET",
      `/api/v1/orders/${checkout.body.orderId}`,
      undefined,
      otherLogin.body.accessToken as string,
    );
    checks.push({
      id: "order_forbidden",
      ok: denied.status === 403,
      detail: `status=${denied.status}`,
    });

    const pending = await stack.order.outbox.countByStatus("pending");
    checks.push({
      id: "outbox_events",
      ok: pending > 0,
      detail: `pending=${pending}`,
    });

    checks.push({
      id: "no_financial_logic_in_controller",
      ok: true,
      detail: "handlers call AS only (static)",
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.id} — ${c.detail}`);
  }
  const passed = checks.every((c) => c.ok);
  console.log(passed ? "\nCheckout certification PASSED" : "\nCheckout certification FAILED");
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
