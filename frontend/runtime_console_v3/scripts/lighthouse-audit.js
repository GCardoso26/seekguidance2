/* eslint-disable @typescript-eslint/no-require-imports */
const lighthouseMod = require("lighthouse");
const lighthouse = lighthouseMod.default || lighthouseMod;
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";

const URLS = [
  `${BASE}/`,
  `${BASE}/loja`,
  `${BASE}/loja/mtg`,
  `${BASE}/loja/busca`,
  `${BASE}/marketplace/cart`,
  `${BASE}/checkout`,
  `${BASE}/comprador`,
  `${BASE}/vendedor/painel`,
  `${BASE}/vendedor/painel/estoque`,
  `${BASE}/decks`,
];

const THRESHOLDS = {
  performance: Number(process.env.LH_MIN_PERF || 95),
  accessibility: Number(process.env.LH_MIN_A11Y || 95),
  bestPractices: Number(process.env.LH_MIN_BP || 95),
  seo: Number(process.env.LH_MIN_SEO || 95),
};

async function runAudit() {
  const reportsDir = path.join(__dirname, "../lighthouse-reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });

  const results = [];

  for (const url of URLS) {
    console.log(`Auditing: ${url}`);
    const runnerResult = await lighthouse(url, {
      logLevel: "error",
      output: ["json", "html"],
      port: chrome.port,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      throttlingMethod: "simulate",
    });

    const reportJson = runnerResult.report[0];
    const reportHtml = runnerResult.report[1];
    const slug = url.replace(/[^a-zA-Z0-9]/g, "_");

    fs.writeFileSync(path.join(reportsDir, `${slug}.json`), reportJson);
    fs.writeFileSync(path.join(reportsDir, `${slug}.html`), reportHtml);

    const categories = JSON.parse(reportJson).categories;
    const scores = {
      url,
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories["best-practices"].score * 100),
      seo: Math.round(categories.seo.score * 100),
    };
    results.push(scores);
    console.log(
      `  P:${scores.performance} A:${scores.accessibility} BP:${scores.bestPractices} SEO:${scores.seo}`,
    );
  }

  await chrome.kill();

  console.log("\nRESUMO");
  console.log("─".repeat(70));
  let failed = false;
  for (const r of results) {
    const pass =
      r.performance >= THRESHOLDS.performance &&
      r.accessibility >= THRESHOLDS.accessibility &&
      r.bestPractices >= THRESHOLDS.bestPractices &&
      r.seo >= THRESHOLDS.seo;
    if (!pass) failed = true;
    console.log(
      `${pass ? "OK" : "FAIL"} ${r.url.padEnd(45)} P:${r.performance} A:${r.accessibility} BP:${r.bestPractices} S:${r.seo}`,
    );
  }

  fs.writeFileSync(path.join(reportsDir, "summary.json"), JSON.stringify(results, null, 2));

  if (failed) {
    console.log("\nAlgumas páginas não atingiram os thresholds mínimos.");
    process.exit(1);
  }
  console.log("\nTodas as páginas passaram no audit.");
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
