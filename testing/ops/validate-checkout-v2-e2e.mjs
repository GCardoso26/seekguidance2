/**
 * E2E Checkout V2 — register → cart → add listing → session → confirm-payment
 *
 *   CHECKOUT_V2_API_URL=https://... LISTING_ID=... node testing/ops/validate-checkout-v2-e2e.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "testing", "reports");

const API = (process.env.CHECKOUT_V2_API_URL || "https://checkout-v2-api.judgetcg.com.br").replace(
  /\/$/,
  "",
);
const FE = (process.env.BASE_URL || "https://judgetcg.com.br").replace(/\/$/, "");
const email = `e2e_${Date.now()}@judgetcg.com.br`;
const password = "TestPass123!";
const displayName = "Checkout V2 E2E";

function loadListingId() {
  if (process.env.LISTING_ID) return process.env.LISTING_ID;
  const seedPath = path.join(reportsDir, "checkout-v2-seed-listing-latest.json");
  if (fs.existsSync(seedPath)) {
    const j = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    return j.listingId || null;
  }
  return null;
}

/** @type {{ step: string, ok: boolean, status?: number, detail: string }[]} */
const steps = [];

async function req(url, init = {}) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 400);
    }
    return { ok: res.ok, status: res.status, body, text };
  } catch (err) {
    return { ok: false, status: 0, body: null, text: String(err) };
  }
}

function record(step, ok, status, detail) {
  steps.push({ step, ok, status, detail: String(detail).slice(0, 500) });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${step} status=${status ?? "-"} ${String(detail).slice(0, 200)}`);
}

async function main() {
  const listingId = loadListingId();
  console.log(`API=${API}`);
  console.log(`FE=${FE}`);
  console.log(`listingId=${listingId}`);
  console.log(`email=${email}`);

  record("seed.listing_id_present", Boolean(listingId), listingId ? 1 : 0, listingId || "missing");

  // health
  {
    const r = await req(`${API}/health`);
    record("api.health", r.status === 200, r.status, JSON.stringify(r.body).slice(0, 200));
  }

  // register + login
  let accessToken = null;
  {
    const reg = await req(`${API}/api/v1/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, displayName, password }),
    });
    record(
      "api.auth.register",
      reg.status >= 200 && reg.status < 300,
      reg.status,
      JSON.stringify(reg.body).slice(0, 250),
    );
    const login = await req(`${API}/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    accessToken =
      login.body?.accessToken ||
      login.body?.access_token ||
      login.body?.tokens?.accessToken ||
      null;
    record(
      "api.auth.login",
      login.status >= 200 && login.status < 300 && Boolean(accessToken),
      login.status,
      accessToken ? "token_received" : JSON.stringify(login.body).slice(0, 250),
    );
  }

  const auth = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  // cart
  let cartId = null;
  if (accessToken) {
    const r = await req(`${API}/api/v1/checkout-v2/cart`, {
      method: "POST",
      headers: auth,
      body: "{}",
    });
    cartId = r.body?.id || null;
    record(
      "api.cart.create",
      (r.status === 201 || r.status === 200) && Boolean(cartId),
      r.status,
      cartId ? `cartId=${cartId}` : JSON.stringify(r.body).slice(0, 300),
    );
  }

  // add listing
  if (accessToken && cartId && listingId) {
    const r = await req(`${API}/api/v1/checkout-v2/cart/${cartId}/items`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ listingId, quantity: 1 }),
    });
    const items = r.body?.items || r.body?.cart?.items || [];
    const hasItem = Array.isArray(items)
      ? items.some((i) => (i.listingId || i.listing_id) === listingId)
      : false;
    record(
      "api.cart.add_item",
      (r.status === 200 || r.status === 201) && (hasItem || Boolean(r.body?.id)),
      r.status,
      JSON.stringify(r.body).slice(0, 350),
    );
  } else {
    record("api.cart.add_item", false, 0, "skipped_missing_deps");
  }

  // start session (card / stripe PI)
  let sessionId = null;
  let clientSecret = null;
  let sessionStatus = null;
  if (accessToken && cartId) {
    const r = await req(`${API}/api/v1/checkout-v2/sessions`, {
      method: "POST",
      headers: { ...auth, "Idempotency-Key": `e2e-${Date.now()}` },
      body: JSON.stringify({ cartId, paymentMethod: "card" }),
    });
    sessionId = r.body?.id || null;
    clientSecret = r.body?.clientSecret || r.body?.client_secret || null;
    sessionStatus = r.body?.status || null;
    const ok =
      r.status === 201 &&
      Boolean(sessionId) &&
      (sessionStatus === "payment_pending" || sessionStatus === "priced");
    record(
      "api.sessions.start",
      ok,
      r.status,
      JSON.stringify({
        id: sessionId,
        status: sessionStatus,
        hasClientSecret: Boolean(clientSecret),
        error: r.body?.error,
        sagaId: r.body?.sagaId,
        totalCents: r.body?.totalCents,
        validationIssues: r.body?.validationIssues,
      }).slice(0, 450),
    );
  } else {
    record("api.sessions.start", false, 0, "skipped_missing_deps");
  }

  // confirm payment (simulate — needs CHECKOUT_ALLOW_SIMULATE=1 on Stripe/MP)
  let confirmStatus = null;
  if (accessToken && sessionId) {
    const r = await req(`${API}/api/v1/checkout-v2/sessions/${sessionId}/confirm-payment`, {
      method: "POST",
      headers: { ...auth, "Idempotency-Key": `e2e-confirm-${Date.now()}` },
      body: JSON.stringify({
        simulateSuccess: true,
        clientSecret: clientSecret || undefined,
      }),
    });
    confirmStatus = r.body?.status || r.body?.session?.status || null;
    const ok = r.status === 200 && (confirmStatus === "completed" || r.body?.status === "completed");
    record(
      "api.sessions.confirm_payment",
      ok,
      r.status,
      JSON.stringify({
        status: confirmStatus,
        error: r.body?.error,
        sagaId: r.body?.sagaId,
        sessionStatus: r.body?.session?.status ?? r.body?.status,
      }).slice(0, 450),
    );
  } else {
    record("api.sessions.confirm_payment", false, 0, "skipped_no_session");
  }

  // BFF production proxy still routes
  {
    const r = await req(`${FE}/api/checkout-v2/cart`, { method: "POST", body: "{}" });
    record(
      "bff.prod.cart_401",
      r.status === 401,
      r.status,
      JSON.stringify(r.body).slice(0, 200),
    );
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const purchaseComplete = steps.some(
    (s) => s.step === "api.sessions.confirm_payment" && s.ok,
  );
  const sessionOk = steps.some((s) => s.step === "api.sessions.start" && s.ok);

  const report = {
    at: new Date().toISOString(),
    api: API,
    fe: FE,
    email,
    listingId,
    cartId,
    sessionId,
    sessionStatus,
    hasClientSecret: Boolean(clientSecret),
    confirmStatus,
    purchaseComplete,
    sessionStarted: sessionOk,
    passed,
    failed,
    steps,
    verdict: failed === 0 ? "PASS" : purchaseComplete ? "PASS_WITH_WARNINGS" : "FAIL",
    readinessNote: purchaseComplete
      ? "Full session→confirm completed on API (not full browser FE purchase)"
      : sessionOk
        ? "Session+PI created; confirm blocked (likely CHECKOUT_ALLOW_SIMULATE missing or Stripe needs real PM)"
        : "Session start failed — see steps",
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, "checkout-v2-e2e-session-payment-latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [
    "# CHECKOUT_V2_E2E_SESSION_PAYMENT",
    "",
    `**Gerado:** ${report.at}`,
    `**Verdict:** ${report.verdict}`,
    `**Compra completa (confirm)?** ${purchaseComplete ? "SIM" : "NÃO"}`,
    `**API:** ${API}`,
    `**Listing:** ${listingId}`,
    "",
    report.readinessNote,
    "",
    `| Step | OK | Status | Detail |`,
    `|------|----|--------|--------|`,
    ...steps.map(
      (s) =>
        `| ${s.step} | ${s.ok ? "PASS" : "FAIL"} | ${s.status ?? ""} | ${String(s.detail).replace(/\|/g, "/")} |`,
    ),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(reportsDir, "CHECKOUT_V2_E2E_SESSION_PAYMENT.md"), md);

  console.log(`\n→ ${jsonPath}`);
  console.log(`Verdict: ${report.verdict} (${passed} pass / ${failed} fail) purchaseComplete=${purchaseComplete}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
