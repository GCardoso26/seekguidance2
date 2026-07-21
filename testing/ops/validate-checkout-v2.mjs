/**
 * Smoke validation — Checkout V2 API + optional BFF proxy.
 * Usage: node testing/ops/validate-checkout-v2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const reportsDir = path.join(repoRoot, "testing", "reports");

const API = (process.env.CHECKOUT_V2_API_URL || "http://127.0.0.1:8791").replace(/\/$/, "");
const FE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = `cv2_${Date.now()}@example.com`;
const password = "TestPass123!";
const displayName = "Checkout V2 Validator";

/** @type {{ step: string, ok: boolean, status?: number, detail: string }[]} */
const steps = [];

async function req(label, url, init = {}) {
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
      body = text.slice(0, 200);
    }
    return { ok: res.ok, status: res.status, body, text };
  } catch (err) {
    return { ok: false, status: 0, body: null, text: String(err) };
  }
}

function record(step, ok, status, detail) {
  steps.push({ step, ok, status, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${step} status=${status ?? "-"} ${detail}`);
}

async function main() {
  console.log(`API=${API}`);
  console.log(`FE=${FE}`);
  console.log(`email=${email}`);

  // 1 health
  {
    const r = await req("health", `${API}/health`);
    record("api.health", r.status === 200, r.status, typeof r.body === "object" ? r.body.status : r.text);
  }

  // 2 unauth → 401
  {
    const r = await req("cart-unauth", `${API}/api/v1/checkout-v2/cart`, { method: "POST", body: "{}" });
    record(
      "api.cart.unauth_401",
      r.status === 401,
      r.status,
      JSON.stringify(r.body),
    );
  }

  // 3 register
  let accessToken = null;
  {
    const r = await req("register", `${API}/api/v1/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, displayName, password }),
    });
    const token =
      r.body?.accessToken ||
      r.body?.access_token ||
      r.body?.tokens?.accessToken ||
      r.body?.session?.accessToken;
    const registered =
      r.status >= 200 && r.status < 300 && Boolean(r.body?.id || r.body?.userId || r.body?.user);
    record(
      "api.auth.register",
      registered,
      r.status,
      registered ? `userId=${r.body?.id ?? r.body?.userId ?? "ok"}` : JSON.stringify(r.body).slice(0, 300),
    );
    if (!accessToken) {
      // register does not return tokens — login next
      const login = await req("login", `${API}/api/v1/auth/login`, {
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
        accessToken ? "token_received" : JSON.stringify(login.body).slice(0, 300),
      );
    }
  }

  // 4 cart authenticated
  let cartId = null;
  if (accessToken) {
    const r = await req("cart", `${API}/api/v1/checkout-v2/cart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: "{}",
    });
    cartId = r.body?.id || null;
    record(
      "api.cart.create",
      r.status === 201 && Boolean(cartId),
      r.status,
      cartId ? `cartId=${cartId}` : JSON.stringify(r.body).slice(0, 300),
    );
  } else {
    record("api.cart.create", false, 0, "skipped_no_token");
  }

  // 5 session without cartId → 400
  if (accessToken) {
    const r = await req("sessions-bad", `${API}/api/v1/checkout-v2/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: "{}",
    });
    record(
      "api.sessions.missing_cartId_400",
      r.status === 400,
      r.status,
      JSON.stringify(r.body),
    );
  }

  // 6 BFF proxy
  {
    const r = await req("bff-cart", `${FE}/api/checkout-v2/cart`, {
      method: "POST",
      body: "{}",
    });
    // Expect 401 from Node (not 404 from Render)
    const notRender404 =
      r.status !== 404 ||
      !(typeof r.body === "object" && r.body?.detail === "Not Found");
    const looksLikeV2 = r.status === 401 || r.status === 201 || r.status === 400;
    record(
      "bff.proxy_to_checkout_v2",
      looksLikeV2 && notRender404,
      r.status,
      JSON.stringify(r.body).slice(0, 200),
    );
  }

  // 7 Vercel misconfig note (detect if FE is remote)
  {
    const vercelMisconfig =
      process.env.CHECKOUT_V2_API_URL === "http://127.0.0.1:8791" &&
      /vercel\.app|judgetcg\.com\.br/i.test(FE);
    record(
      "ops.vercel_localhost_warning",
      !vercelMisconfig,
      vercelMisconfig ? 1 : 0,
      vercelMisconfig
        ? "Vercel cannot reach 127.0.0.1 of your PC — use local FE or tunnel/public API"
        : "local_ok_or_not_applicable",
    );
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const report = {
    at: new Date().toISOString(),
    api: API,
    fe: FE,
    email,
    cartId,
    passed,
    failed,
    steps,
    verdict: failed === 0 ? "PASS" : "FAIL",
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, "checkout-v2-api-validation-latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [
    "# CHECKOUT_V2_API_VALIDATION",
    "",
    `**Gerado:** ${report.at}`,
    `**Verdict:** ${report.verdict}`,
    `**API:** ${API}`,
    `**FE:** ${FE}`,
    "",
    `| Step | OK | Status | Detail |`,
    `|------|----|--------|--------|`,
    ...steps.map(
      (s) =>
        `| ${s.step} | ${s.ok ? "PASS" : "FAIL"} | ${s.status ?? ""} | ${String(s.detail).replace(/\|/g, "/")} |`,
    ),
    "",
    "## Nota Vercel",
    "",
    "`CHECKOUT_V2_API_URL=http://127.0.0.1:8791` no Vercel **não funciona**: o BFF roda na cloud e `127.0.0.1` é o host da Vercel, não o seu PC.",
    "Use essa URL só no **FE local** (`.env.local`), ou exponha a API Node via tunnel/host público.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(reportsDir, "CHECKOUT_V2_API_VALIDATION.md"), md);

  console.log(`\n→ ${jsonPath}`);
  console.log(`Verdict: ${report.verdict} (${passed} pass / ${failed} fail)`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
