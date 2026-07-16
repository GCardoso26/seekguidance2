/**
 * Payment Certification (Sprint 5.5).
 * Usage: DATABASE_URL=... npm run certify:payment
 */
import { Pool } from "pg";
import { createInMemoryCheckoutApiStack } from "../order/createInMemoryCheckoutApiStack.js";
import { createPostgresPaymentStack } from "./createPostgresPaymentStack.js";
import { getIdGenerator } from "../shared/ids/IdGenerator.js";
import { fakePaymentSignature } from "./infrastructure/fake/FakePaymentProvider.js";
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
  headers?: Record<string, string>,
) {
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

async function main(): Promise<void> {
  const checks: Check[] = [];
  const url = process.env.DATABASE_URL ?? process.env.CONTRACT_DATABASE_URL;

  if (url) {
    const pool = new Pool({ connectionString: url });
    try {
      for (const table of ["payments", "payment_events"]) {
        const r = await pool.query(
          `SELECT 1 FROM information_schema.tables WHERE table_schema = 'payment' AND table_name = $1`,
          [table],
        );
        checks.push({
          id: `table_payment.${table}`,
          ok: r.rowCount === 1,
          detail: r.rowCount === 1 ? "ok" : "missing",
        });
      }

      const fk = await pool.query(`
        SELECT COUNT(*)::int AS n
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.constraint_schema = tc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'payment'
          AND ccu.table_schema IN ('marketplace', 'catalog', 'identity', 'order', 'cart')
      `);
      checks.push({
        id: "no_cross_context_fk",
        ok: Number(fk.rows[0]?.n ?? 1) === 0,
        detail: `cross_fk=${fk.rows[0]?.n ?? "?"}`,
      });

      const pg = createPostgresPaymentStack(pool);
      const requestId = getIdGenerator().generate();
      const created = await pg.requestPayment.execute({
        requestId,
        orderId: getIdGenerator().generate(),
        amountCents: 777,
        reservationIds: [],
      });
      const again = await pg.requestPayment.execute({
        requestId,
        orderId: created.payment.orderId,
        amountCents: 777,
        reservationIds: [],
      });
      checks.push({
        id: "pg_request_idempotent",
        ok: again.idempotent && again.payment.id === created.payment.id,
        detail: `id=${created.payment.id}`,
      });

      await pool.query(`DELETE FROM payment.payment_events WHERE payment_id = $1`, [
        created.payment.id,
      ]);
      await pool.query(`DELETE FROM payment.payments WHERE id = $1`, [created.payment.id]);
    } finally {
      await pool.end();
    }
  } else {
    checks.push({
      id: "pg_skipped",
      ok: true,
      detail: "DATABASE_URL not set — schema checks skipped",
    });
  }

  // In-memory webhook smoke
  const stack = createInMemoryCheckoutApiStack();
  const server = stack.createServer();
  const port = await listen(server);
  try {
    const password = "cert-pay-1!";
    const sellerEmail = `s-${getIdGenerator().generate().slice(0, 8)}@cert.local`;
    const buyerEmail = `b-${getIdGenerator().generate().slice(0, 8)}@cert.local`;
    await json(port, "POST", "/api/v1/auth/register", {
      email: sellerEmail,
      displayName: "S",
      password,
    });
    const sellerLogin = await json(port, "POST", "/api/v1/auth/login", {
      email: sellerEmail,
      password,
    });
    await json(port, "POST", "/api/v1/auth/register", {
      email: buyerEmail,
      displayName: "B",
      password,
    });
    const buyerLogin = await json(port, "POST", "/api/v1/auth/login", {
      email: buyerEmail,
      password,
    });
    const sellerToken = sellerLogin.body.accessToken as string;
    const buyerToken = buyerLogin.body.accessToken as string;

    await json(
      port,
      "POST",
      "/api/v1/marketplace/sellers",
      { displayName: "Cert Pay" },
      sellerToken,
    );
    const cardId = getIdGenerator().generate();
    const variantId = getIdGenerator().generate();
    const inv = await json(
      port,
      "POST",
      "/api/v1/marketplace/inventory",
      { catalogCardId: cardId, catalogVariantId: variantId, quantity: 1 },
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
        priceCents: 1100,
        condition: "NM",
        quantity: 1,
        status: "active",
      },
      sellerToken,
    );
    const cart = await json(port, "POST", "/api/v1/cart", {}, buyerToken);
    await json(
      port,
      "POST",
      `/api/v1/cart/${cart.body.id}/items`,
      { listingId: listing.body.id, quantity: 1 },
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
    checks.push({
      id: "pay_requested",
      ok: pay.status === 200 && pay.body.paymentStatus === "REQUESTED",
      detail: `status=${pay.body.paymentStatus}`,
    });

    const paymentId = pay.body.paymentId as string;
    const wh = await json(
      port,
      "POST",
      "/api/v1/payments/webhook",
      {
        provider: "fake",
        event: "payment.approved",
        paymentId,
        idempotencyKey: `cert-${paymentId}`,
      },
      undefined,
      { "X-Payment-Signature": fakePaymentSignature(paymentId) },
    );
    checks.push({
      id: "webhook_authorized",
      ok: wh.status === 200 && wh.body.paymentStatus === "AUTHORIZED" && wh.body.orderStatus === "PAID",
      detail: `payment=${wh.body.paymentStatus} order=${wh.body.orderStatus}`,
    });

    const dup = await json(
      port,
      "POST",
      "/api/v1/payments/webhook",
      {
        provider: "fake",
        event: "payment.approved",
        paymentId,
        idempotencyKey: `cert-${paymentId}`,
      },
      undefined,
      { "X-Payment-Signature": fakePaymentSignature(paymentId) },
    );
    checks.push({
      id: "webhook_idempotent",
      ok: dup.body.duplicate === true,
      detail: `duplicate=${dup.body.duplicate}`,
    });
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }

  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.id} — ${c.detail}`);
  }
  const passed = checks.every((c) => c.ok);
  console.log(passed ? "\nPayment certification PASSED" : "\nPayment certification FAILED");
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
