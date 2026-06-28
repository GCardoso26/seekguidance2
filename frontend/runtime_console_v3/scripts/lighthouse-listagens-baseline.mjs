/**
 * Extrai métricas Lighthouse da rota listagens e grava baseline JSON.
 * Uso: node scripts/lighthouse-listagens-baseline.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.argv[2] || "http://localhost:3000";
const URL = `${BASE}/vendedor/painel/listagens`;
const OUT_DIR = join(ROOT, "lighthouse-reports");

function extractMetrics(lhr) {
  const perf = lhr.categories.performance?.score ?? 0;
  const audits = lhr.audits;
  return {
    url: URL,
    capturedAt: new Date().toISOString(),
    performanceScore: Math.round(perf * 100),
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    fcpMs: audits["first-contentful-paint"]?.numericValue ?? null,
  };
}

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(URL, {
      logLevel: "error",
      output: "json",
      port: chrome.port,
      onlyCategories: ["performance"],
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 375, height: 667, deviceScaleFactor: 2, disabled: false },
    });
    const lhr = JSON.parse(result.report);
    return extractMetrics(lhr);
  } finally {
    await chrome.kill();
  }
}

async function ensureServer() {
  if (process.env.SKIP_SERVER) return;
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "start"], { cwd: ROOT, shell: true, stdio: "pipe" });
    let ready = false;
    child.stdout.on("data", (buf) => {
      if (!ready && String(buf).includes("Ready")) {
        ready = true;
        resolve(child);
      }
    });
    child.stderr.on("data", (buf) => {
      if (!ready && String(buf).includes("Ready")) {
        ready = true;
        resolve(child);
      }
    });
    child.on("error", reject);
    setTimeout(() => {
      if (!ready) {
        child.kill();
        reject(new Error("Server start timeout"));
      }
    }, 120_000);
  });
}

async function main() {
  let server;
  try {
    if (!process.env.SKIP_SERVER) {
      console.log("Starting Next.js server…");
      server = await ensureServer();
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log(`Auditing ${URL} (mobile 375px)…`);
    const metrics = await runLighthouse();
    await mkdir(OUT_DIR, { recursive: true });
    const outPath = join(OUT_DIR, "lighthouse-baseline-listagens.json");
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
