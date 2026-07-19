/**
 * Lifecycle E2E — seed isolado por runId.
 * Manifest: e2e/.seed/run.json
 *
 * Guard: nunca em beta/production (LPC/LCS isolation).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(root, "../..");
const seedDir = path.join(root, "e2e", ".seed");
const manifestPath = path.join(seedDir, "run.json");

function assertNotBeta() {
  const guard = path.join(repoRoot, "testing", "guards", "assert-not-beta.mjs");
  if (!fs.existsSync(guard)) return;
  const r = spawnSync(process.execPath, [guard, "seed"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "seed blocked by testing guard");
    process.exit(r.status ?? 1);
  }
  if (r.stdout) process.stdout.write(r.stdout);
}

function loadDotEnv() {
  const envPath = path.join(root, ".env.local");
  const alt = path.join(root, ".env");
  for (const p of [envPath, alt]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildSeed() {
  const runId = `e2e-${Date.now().toString(36)}`;
  const productId = `${runId}-product-1`;
  const orderId = `${runId}-order-1`;
  return {
    runId,
    createdAt: new Date().toISOString(),
    users: {
      seller: {
        email: "test-seller@judgetcg.com",
        password: "TestSeller123!",
        name: "Test Seller",
      },
      buyer: {
        email: "test-buyer@judgetcg.com",
        password: "TestBuyer123!",
        name: "Test Buyer",
      },
    },
    store: {
      id: `${runId}-store`,
      slug: `e2e-store-${runId.slice(-6)}`,
      name: "E2E Lifecycle Store",
      subscription_plan: "pro",
      shop_enabled: true,
    },
    categories: [
      { id: "sleeve", label: "Sleeves" },
      { id: "deck_box", label: "Deck Box" },
      { id: "playmat", label: "Playmat" },
    ],
    products: [
      {
        id: productId,
        name: `E2E Sleeve ${runId.slice(-4)}`,
        category: "sleeve",
        price_cents: 1990,
        stock: 25,
        sku: `E2E-SLV-${runId.slice(-6)}`,
        is_active: true,
      },
    ],
    stock: [
      {
        id: `${runId}-stock-1`,
        product_id: productId,
        title: `E2E Sleeve ${runId.slice(-4)}`,
        quantity: 25,
        price_cents: 1990,
        kind: "products",
        category: "sleeve",
      },
    ],
    orders: [
      {
        id: orderId,
        status: "paid",
        total_cents: 1990,
        payment_method: "pix",
        customer_name: "Cliente E2E",
        created_at: new Date().toISOString(),
        fulfillment_status: "Pending",
      },
    ],
    carts: [
      {
        id: `${runId}-cart-1`,
        buyer_email: "test-buyer@judgetcg.com",
        items: [{ product_id: productId, quantity: 1, unit_price_cents: 1990 }],
      },
    ],
    promotion: null,
    report: {
      revenue_cents: 8435000,
      sales_count: 2386,
      unique_buyers: 842,
      average_order_value: 126.9,
      chart: [
        { date: "2026-07-01", revenue_cents: 280000 },
        { date: "2026-07-08", revenue_cents: 310000 },
        { date: "2026-07-15", revenue_cents: 295000 },
      ],
      top_cards: [{ name: `E2E Sleeve ${runId.slice(-4)}`, count: 12, revenue_cents: 23880 }],
    },
  };
}

async function ensureAuthUsers(seed) {
  try {
    let mod = null;
    try {
      mod = await import("../helpers/supabase-auth.ts");
    } catch {
      try {
        mod = await import("../helpers/supabase-auth.js");
      } catch {
        mod = null;
      }
    }
    if (!mod?.setupTestUsers) {
      console.log("✓ usuários (auth setup deferred to Playwright project=setup)");
      return;
    }
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    await mod.setupTestUsers(baseURL);
    console.log("✓ usuários");
  } catch (err) {
    console.warn("⚠ usuários: setup via Playwright auth.setup (SERVICE_ROLE opcional)", err?.message || err);
  }
  void seed;
}

async function main() {
  loadDotEnv();
  assertNotBeta();
  ensureDir(seedDir);
  const seed = buildSeed();
  fs.writeFileSync(manifestPath, JSON.stringify(seed, null, 2), "utf8");

  console.log(`seed:test runId=${seed.runId}`);
  await ensureAuthUsers(seed);
  console.log("✓ produtos", seed.products.length);
  console.log("✓ pedidos", seed.orders.length);
  console.log("✓ categorias", seed.categories.length);
  console.log("✓ estoque", seed.stock.length);
  console.log("✓ carrinhos", seed.carts.length);
  console.log(`✓ manifest → ${path.relative(root, manifestPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
