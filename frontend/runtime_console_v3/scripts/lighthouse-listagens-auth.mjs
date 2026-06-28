/**
 * Métricas de performance na rota listagens COM sessão Playwright.
 * Uso: npm run build && npm run lighthouse:listagens:auth
 *
 * Requer e2e/.auth/seller.json (setup E2E).
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const URL = `${BASE}/vendedor/painel/listagens`;
const OUT_DIR = join(ROOT, "lighthouse-reports");
const AUTH_STATE = process.env.AUTH_STATE || join(ROOT, "e2e", ".auth", "seller.json");

async function ensureServer() {
  if (process.env.SKIP_SERVER) return null;
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "start"], { cwd: ROOT, shell: true, stdio: "pipe" });
    let ready = false;
    const onData = (buf) => {
      if (!ready && String(buf).includes("Ready")) {
        ready = true;
        resolve(child);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    setTimeout(() => {
      if (!ready) {
        child.kill();
        reject(new Error("Server start timeout"));
      }
    }, 120_000);
  });
}

async function runAuthenticatedAudit() {
  let hasAuth = false;
  try {
    await access(AUTH_STATE);
    hasAuth = true;
  } catch {
    console.warn(`Auth state não encontrado: ${AUTH_STATE}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    hasAuth
      ? { storageState: AUTH_STATE, viewport: { width: 375, height: 667 } }
      : { viewport: { width: 375, height: 667 } },
  );
  const page = await context.newPage();

  const start = Date.now();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  const finalUrl = page.url();
  const authenticated = hasAuth && !finalUrl.includes("/entrar");

  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((p) => p.name === "first-contentful-paint");
    return {
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
      loadEventEndMs: nav ? nav.loadEventEnd : null,
      fcpMs: fcp ? fcp.startTime : null,
    };
  });

  await browser.close();

  return {
    url: URL,
    finalUrl,
    authenticated,
    capturedAt: new Date().toISOString(),
    wallClockMs: Date.now() - start,
    ...vitals,
    note: authenticated
      ? "Audit autenticado via Playwright storageState"
      : "Sessão ausente ou redirect login — configure e2e/.auth/seller.json",
  };
}

async function main() {
  let server;
  try {
    if (!process.env.SKIP_SERVER) {
      console.log("Starting Next.js server…");
      server = await ensureServer();
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log(`Auditing ${URL} (375px)…`);
    const metrics = await runAuthenticatedAudit();
    await mkdir(OUT_DIR, { recursive: true });
    const outPath = join(OUT_DIR, "lighthouse-auth-listagens.json");
    await writeFile(outPath, JSON.stringify(metrics, null, 2));
    console.log(JSON.stringify(metrics, null, 2));
    console.log(`Saved: ${outPath}`);
  } finally {
    server?.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
