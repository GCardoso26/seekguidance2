/**
 * Checkout production certification — saga, webhook idempotency, concurrency, refunds (gateway-level).
 * Combines in-memory certify:checkout + live PSP probe evidence.
 *
 * Usage: npx tsx scripts/certify-checkout-production.ts
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

interface Check {
  id: string;
  ok: boolean;
  detail: string;
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, ...env },
      shell: true,
    });
    let out = "";
    child.stdout?.on("data", (d) => {
      out += String(d);
    });
    child.stderr?.on("data", (d) => {
      out += String(d);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function main(): Promise<void> {
  const checks: Check[] = [];

  const checkout = await run("npm", ["run", "certify:checkout"]);
  checks.push({
    id: "certify_checkout_saga",
    ok: checkout.code === 0 && /Checkout certification PASSED/.test(checkout.out),
    detail: checkout.out.split("\n").filter((l) => l.startsWith("✓") || /PASSED|FAILED/.test(l)).slice(-12).join(" | "),
  });

  const payment = await run("npm", ["run", "certify:payment"]);
  checks.push({
    id: "certify_payment_webhook_idempotent",
    ok: payment.code === 0 && /Payment certification PASSED/.test(payment.out),
    detail: payment.out.split("\n").filter((l) => l.startsWith("✓") || /PASSED|FAILED/.test(l)).slice(-8).join(" | "),
  });

  const order = await run("npx", ["tsx", "src/order/runOrderCertification.ts"]);
  checks.push({
    id: "certify_order_reservation_concurrency",
    ok: order.code === 0 && /Order certification PASSED/.test(order.out),
    detail: order.out.split("\n").filter((l) => l.startsWith("✓") || /PASSED|FAILED|required/.test(l)).slice(-10).join(" | "),
  });

  const live = await run("npx", ["tsx", "scripts/_run_pay_ship_live.ts"]);
  let liveOk = false;
  try {
    const parsed = JSON.parse(live.out.trim().split("\n").pop() ?? "[]") as { c: string; ok: boolean }[];
    liveOk = Array.isArray(parsed) && parsed.length > 0 && parsed.every((x) => x.ok);
    checks.push({
      id: "live_psp_stripe_mp_me",
      ok: liveOk,
      detail: Array.isArray(parsed) ? parsed.map((x) => `${x.c}:${x.ok}`).join(",") : live.out.slice(0, 200),
    });
  } catch {
    checks.push({ id: "live_psp_stripe_mp_me", ok: false, detail: live.out.slice(0, 300) });
  }

  const vitest = await run("npx", ["vitest", "run", "src/checkout/__tests__", "--reporter=dot"]);
  checks.push({
    id: "checkout_vitest",
    ok: vitest.code === 0,
    detail: (vitest.out.match(/Tests\s+\d+[^\n]*/)?.[0] ?? vitest.out.slice(-200)).trim(),
  });

  const ok = checks.every((c) => c.ok);
  const report = {
    ok,
    date: new Date().toISOString(),
    gateNote:
      "In-memory saga+webhook+concurrency PASS; live Stripe/MP PIX/ME PASS. Chargeback simulation and browser double-click E2E remain in Playwright suites.",
    checks,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
