/**
 * Validate Checkout V2 via Cloudflare tunnel + Vercel BFF.
 * Usage:
 *   CHECKOUT_V2_API_URL=https://xxx.trycloudflare.com BASE_URL=https://judgetcg.com.br node testing/ops/validate-checkout-v2-vercel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(__dirname, "../reports");

const TUNNEL = (
  process.env.CHECKOUT_V2_API_URL ||
  "https://optical-son-interpretation-paid.trycloudflare.com"
).replace(/\/$/, "");
const FE = (process.env.BASE_URL || "https://judgetcg.com.br").replace(/\/$/, "");
const email = `cv2v_${Date.now()}@example.com`;
const password = "TestPass123!";
const displayName = "Checkout V2 Vercel Validator";

/** @type {{ step: string, ok: boolean, status?: number, detail: string }[]} */
const steps = [];

async function req(url, init = {}) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      redirect: "follow",
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 240);
    }
    return { status: res.status, body, text };
  } catch (err) {
    return { status: 0, body: null, text: String(err) };
  }
}

function record(step, ok, status, detail) {
  steps.push({ step, ok, status, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${step} status=${status ?? "-"} ${String(detail).slice(0, 160)}`);
}

async function main() {
  console.log(`TUNNEL=${TUNNEL}`);
  console.log(`FE=${FE}`);

  // Tunnel direct
  {
    const r = await req(`${TUNNEL}/health`);
    record("tunnel.health", r.status === 200, r.status, r.body?.status ?? r.text);
  }
  {
    const r = await req(`${TUNNEL}/api/v1/checkout-v2/cart`, { method: "POST", body: "{}" });
    record("tunnel.cart.unauth_401", r.status === 401, r.status, JSON.stringify(r.body));
  }

  // Auth + cart on tunnel
  let accessToken = null;
  let cartId = null;
  {
    const reg = await req(`${TUNNEL}/api/v1/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, displayName, password }),
    });
    record(
      "tunnel.auth.register",
      reg.status === 201 && Boolean(reg.body?.id),
      reg.status,
      reg.body?.id ? `userId=${reg.body.id}` : JSON.stringify(reg.body),
    );

    const login = await req(`${TUNNEL}/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    accessToken = login.body?.accessToken || null;
    record(
      "tunnel.auth.login",
      login.status === 200 && Boolean(accessToken),
      login.status,
      accessToken ? "token_received" : JSON.stringify(login.body),
    );
  }

  if (accessToken) {
    const cart = await req(`${TUNNEL}/api/v1/checkout-v2/cart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: "{}",
    });
    cartId = cart.body?.id || null;
    record(
      "tunnel.cart.create",
      cart.status === 201 && Boolean(cartId),
      cart.status,
      cartId ? `cartId=${cartId}` : JSON.stringify(cart.body),
    );

    const sess = await req(`${TUNNEL}/api/v1/checkout-v2/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: "{}",
    });
    record(
      "tunnel.sessions.missing_cartId_400",
      sess.status === 400,
      sess.status,
      JSON.stringify(sess.body),
    );
  } else {
    record("tunnel.cart.create", false, 0, "skipped_no_token");
    record("tunnel.sessions.missing_cartId_400", false, 0, "skipped_no_token");
  }

  // Vercel BFF (apex + www)
  for (const base of [FE, FE.replace("://", "://www.")]) {
    const label = base.includes("www.") ? "www" : "apex";
    const r = await req(`${base}/api/checkout-v2/cart`, { method: "POST", body: "{}" });
    const ok =
      r.status === 401 &&
      !(typeof r.body === "object" && r.body?.detail === "Not Found") &&
      r.status !== 500;
    record(
      `vercel.bff.${label}.cart_unauth`,
      ok,
      r.status,
      JSON.stringify(r.body),
    );
  }

  // Optional: BFF with bearer (cookie-less — may 401 if BFF only forwards cookie auth)
  if (accessToken) {
    const r = await req(`${FE}/api/checkout-v2/cart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: "{}",
    });
    // Prefer upstream success; 401 acceptable until BFF forwards Authorization (cookie-only legacy).
    const ok = r.status === 201 || r.status === 401;
    record(
      "vercel.bff.apex.cart_with_bearer",
      ok,
      r.status,
      r.status === 201
        ? `cartId=${r.body?.id ?? "ok"}`
        : `note=bff_cookie_auth_only_until_redeploy ${JSON.stringify(r.body).slice(0, 120)}`,
    );
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const report = {
    at: new Date().toISOString(),
    tunnel: TUNNEL,
    fe: FE,
    email,
    cartId,
    passed,
    failed,
    steps,
    verdict: failed === 0 ? "PASS" : "FAIL",
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "checkout-v2-vercel-tunnel-validation-latest.json"),
    JSON.stringify(report, null, 2),
  );

  const md = [
    "# CHECKOUT_V2_VERCEL_TUNNEL_VALIDATION",
    "",
    `**Gerado:** ${report.at}`,
    `**Verdict:** ${report.verdict}`,
    `**Tunnel:** ${TUNNEL}`,
    `**FE:** ${FE}`,
    "",
    `| Step | OK | Status | Detail |`,
    `|------|----|--------|--------|`,
    ...steps.map(
      (s) =>
        `| ${s.step} | ${s.ok ? "PASS" : "FAIL"} | ${s.status ?? ""} | ${String(s.detail).replace(/\|/g, "/")} |`,
    ),
    "",
    "## Interpretação",
    "",
    "- BFF Vercel → tunnel com **401** = `CHECKOUT_V2_API_URL` correto (não localhost).",
    "- Tunnel health/cart/auth = API Node acessível publicamente.",
    "- Pagamento Stripe/MP / pedido completo **não** cobertos neste smoke.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(reportsDir, "CHECKOUT_V2_VERCEL_TUNNEL_VALIDATION.md"), md);

  console.log(`\nVerdict: ${report.verdict} (${passed} pass / ${failed} fail)`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
