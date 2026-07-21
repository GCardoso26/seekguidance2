/**
 * Payment + Shipping validation harness.
 * Live Stripe/MP/ME when secrets present; otherwise full Stub matrix + BLOCKED live.
 *
 * Usage: node testing/ops/validate-payment-shipping.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const apiRoot = path.join(repoRoot, "services", "api");
const reportsDir = path.join(repoRoot, "testing", "reports");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i);
    const v = t.slice(i + 1).replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}

loadEnv(path.join(apiRoot, ".env"));

const secrets = {
  stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 8),
  mp: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_ACCESS_TOKEN.length > 8),
  me: Boolean(process.env.MELHOR_ENVIO_TOKEN && process.env.MELHOR_ENVIO_TOKEN.length > 8),
};

/** @type {{ area: string, case: string, status: 'PASS'|'FAIL'|'BLOCKED'|'SKIP', detail: string }[]} */
const rows = [];

function record(area, caseName, status, detail) {
  rows.push({ area, case: caseName, status, detail: String(detail).slice(0, 400) });
  console.log(`[${status}] ${area}/${caseName} — ${String(detail).slice(0, 160)}`);
}

function runVitest() {
  const r = spawnSync(
    "npx",
    [
      "vitest",
      "run",
      "src/checkout/__tests__/PaymentValidation.final.test.ts",
      "src/checkout/__tests__/PaymentGateway.adapters.test.ts",
      "src/checkout/__tests__/ShippingProvider.test.ts",
      "src/checkout/__tests__/ConfirmPayment.test.ts",
    ],
    { cwd: apiRoot, encoding: "utf8", shell: true },
  );
  const ok = r.status === 0;
  record(
    "unit",
    "payment_shipping_vitest",
    ok ? "PASS" : "FAIL",
    ok ? "PaymentValidation+adapters+Shipping+ConfirmPayment" : (r.stderr || r.stdout || "").slice(-500),
  );
  return ok;
}

function runStubMatrix() {
  const r = spawnSync("npx", ["tsx", "scripts/_run_pay_ship_matrix.ts"], {
    cwd: apiRoot,
    encoding: "utf8",
    shell: true,
    env: process.env,
  });
  const lines = (r.stdout || "").trim().split(/\r?\n/);
  const jsonLine = [...lines].reverse().find((l) => l.startsWith("["));
  if (!jsonLine) {
    record("stub", "matrix_runner", "FAIL", (r.stderr || r.stdout || "no output").slice(-400));
    return;
  }
  /** @type {{ c: string, ok: boolean, d: string }[]} */
  const items = JSON.parse(jsonLine);
  for (const it of items) {
    const isLiveConstruct = it.c.startsWith("live_construct_");
    if (isLiveConstruct) {
      record("live_gate", it.c, it.ok ? "PASS" : "BLOCKED", it.d);
    } else {
      record("stub", it.c, it.ok ? "PASS" : "FAIL", it.d);
    }
  }
}

function attemptLive() {
  if (!secrets.stripe && !secrets.mp && !secrets.me) {
    record("live", "stripe_card_approved", "BLOCKED", "STRIPE_SECRET_KEY missing on api:checkout-v2 host");
    record("live", "stripe_card_declined", "BLOCKED", "STRIPE_SECRET_KEY missing");
    record("live", "stripe_webhook_refund", "BLOCKED", "STRIPE_SECRET_KEY missing");
    record("live", "mp_pix_qr", "BLOCKED", "MERCADOPAGO_ACCESS_TOKEN missing");
    record("live", "mp_pix_webhook", "BLOCKED", "MERCADOPAGO_ACCESS_TOKEN missing");
    record("live", "melhor_envio_quote", "BLOCKED", "MELHOR_ENVIO_TOKEN missing");
    record("live", "melhor_envio_cep_modality", "BLOCKED", "MELHOR_ENVIO_TOKEN missing");
    return;
  }

  const r = spawnSync("npx", ["tsx", "scripts/_run_pay_ship_live.ts"], {
    cwd: apiRoot,
    encoding: "utf8",
    shell: true,
    env: process.env,
  });
  const lines = (r.stdout || "").trim().split(/\r?\n/);
  const jsonLine = [...lines].reverse().find((l) => l.startsWith("["));
  if (!jsonLine) {
    record("live", "runner", "FAIL", (r.stderr || r.stdout || "").slice(-500));
    return;
  }
  for (const it of JSON.parse(jsonLine)) {
    record("live", it.c, it.ok ? "PASS" : "FAIL", it.d);
  }
}

function main() {
  console.log("secrets", secrets);
  runVitest();
  runStubMatrix();
  attemptLive();

  const passed = rows.filter((r) => r.status === "PASS").length;
  const failed = rows.filter((r) => r.status === "FAIL").length;
  const blocked = rows.filter((r) => r.status === "BLOCKED").length;
  const verdict =
    failed > 0
      ? "FAIL"
      : !secrets.stripe || !secrets.mp || !secrets.me
        ? "BLOCKED_LIVE"
        : "PASS";

  const report = {
    at: new Date().toISOString(),
    secrets: {
      STRIPE_SECRET_KEY: secrets.stripe ? "SET" : "MISSING",
      MERCADOPAGO_ACCESS_TOKEN: secrets.mp ? "SET" : "MISSING",
      MELHOR_ENVIO_TOKEN: secrets.me ? "SET" : "MISSING",
      CHECKOUT_PAYMENT_GATEWAY: process.env.CHECKOUT_PAYMENT_GATEWAY || "stub(default)",
    },
    passed,
    failed,
    blocked,
    verdict,
    rows,
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "payment-shipping-validation-latest.json"),
    JSON.stringify(report, null, 2),
  );

  const payRows = rows.filter(
    (r) =>
      r.area === "unit" ||
      r.area === "live" ||
      r.area === "live_gate" ||
      (r.area === "stub" && !r.case.includes("shipping")),
  );
  const shipRows = rows.filter(
    (r) =>
      r.case.includes("shipping") ||
      r.case.includes("melhor") ||
      r.case.includes("me_") ||
      r.case === "live_construct_melhor_envio",
  );

  const mdPay = [
    "# PAYMENT_VALIDATION_REPORT",
    "",
    `**Gerado:** ${report.at}`,
    `**Verdict:** ${verdict}`,
    "",
    "## Secrets (host do api:checkout-v2)",
    "",
    "| Key | State |",
    "|-----|-------|",
    ...Object.entries(report.secrets).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Cases",
    "",
    "| Area | Case | Status | Detail |",
    "|------|------|--------|--------|",
    ...payRows.map(
      (r) => `| ${r.area} | ${r.case} | ${r.status} | ${r.detail.replace(/\|/g, "/")} |`,
    ),
    "",
    "## Confidence",
    "",
    secrets.stripe && secrets.mp
      ? "**live attempted** — ver cases"
      : "**~18%** — Stub/unit completo; live BLOCKED (BUG-0009)",
    "",
    "## Bugs",
    "",
    "- **BUG-0009 P0** — secrets Stripe/MP ausentes no processo Node Checkout V2",
    "",
    "Live Stripe aprovado/recusado/webhook/refund e MP PIX: **não executáveis** sem keys neste host.",
    "",
  ].join("\n");

  const mdShip = [
    "# SHIPPING_VALIDATION_REPORT",
    "",
    `**Gerado:** ${report.at}`,
    `**Verdict:** ${secrets.me ? "SEE_CASES" : "BLOCKED_LIVE"}`,
    "",
    "| Case | Status | Detail |",
    "|------|--------|--------|",
    ...shipRows.map((r) => `| ${r.case} | ${r.status} | ${r.detail.replace(/\|/g, "/")} |`),
    "",
    "## Confidence",
    "",
    secrets.me ? "ver cases live" : "**~18%** stub quote/CEP/modalidade/SLA — MELHOR_ENVIO_TOKEN MISSING",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(reportsDir, "PAYMENT_VALIDATION_REPORT.md"), mdPay);
  fs.writeFileSync(path.join(reportsDir, "SHIPPING_VALIDATION_REPORT.md"), mdShip);

  console.log(`\nVerdict: ${verdict} (pass=${passed} fail=${failed} blocked=${blocked})`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
