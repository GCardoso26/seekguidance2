#!/usr/bin/env node
/**
 * Audita rotas estáticas do app com Lighthouse (mobile + desktop).
 * Uso: node scripts/run-lighthouse-all.mjs [baseUrl]
 */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const APP_DIR = join(ROOT, "src", "app");
const OUT_DIR = join(ROOT, "lighthouse-reports");
const BASE_URL = (process.argv[2] || "https://judgetcg.com.br").replace(/\/$/, "");
const LH_CLI = join(ROOT, "node_modules", "lighthouse", "cli", "index.js");

const METRICS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "interactive",
  "speed-index",
];

function collectStaticRoutes(dir, segments = []) {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("(") && entry.endsWith(")")) {
      routes.push(...collectStaticRoutes(full, segments));
      continue;
    }
    if (entry.startsWith("[") || entry.startsWith("_")) continue;
    const next = [...segments, entry];
    const pageFile = join(full, "page.tsx");
    if (existsSync(pageFile)) {
      routes.push("/" + next.join("/"));
    }
    routes.push(...collectStaticRoutes(full, next));
  }
  return routes;
}

function slug(path) {
  return path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
}

function runAudit(url, preset, outFile) {
  execFileSync(
    process.execPath,
    [
      LH_CLI,
      url,
      "--quiet",
      `--preset=${preset}`,
      '--chrome-flags=--headless=new',
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${outFile}`,
    ],
    { stdio: "inherit", cwd: ROOT },
  );
}

function parseReport(file) {
  const d = JSON.parse(readFileSync(file, "utf8"));
  const row = {
    path: new URL(d.requestedUrl || d.finalUrl).pathname,
    formFactor: d.configSettings?.formFactor || "?",
    fetchTime: d.fetchTime,
    performance: null,
    accessibility: null,
    bestPractices: null,
    seo: null,
    metrics: {},
  };
  for (const [k, v] of Object.entries(d.categories || {})) {
    if (v.score == null) continue;
    const score = Math.round(v.score * 100);
    if (k === "performance") row.performance = score;
    else if (k === "accessibility") row.accessibility = score;
    else if (k === "best-practices") row.bestPractices = score;
    else if (k === "seo") row.seo = score;
  }
  for (const k of METRICS) {
    const a = d.audits?.[k];
    if (a?.displayValue) row.metrics[k] = a.displayValue;
  }
  return row;
}

const routes = [
  "/",
  ...[...new Set(collectStaticRoutes(APP_DIR))].sort((a, b) => a.localeCompare(b)),
];

mkdirSync(OUT_DIR, { recursive: true });
console.log(`Base: ${BASE_URL}`);
console.log(`Rotas estáticas: ${routes.length}\n`);

const summary = [];
const errors = [];

for (const route of routes) {
  const url = `${BASE_URL}${route}`;
  const base = slug(route);
  for (const [preset, suffix] of [
    ["perf", "mobile"],
    ["desktop", "desktop"],
  ]) {
    const outFile = join(OUT_DIR, `${base}-${suffix}.json`);
    process.stdout.write(`→ ${route} (${suffix})... `);
    try {
      runAudit(url, preset, outFile);
      summary.push(parseReport(outFile));
      console.log("ok");
    } catch (e) {
      console.log("erro");
      errors.push({ route, suffix, message: String(e.message || e) });
    }
  }
}

writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify({ baseUrl: BASE_URL, routes, summary, errors }, null, 2));

const md = [
  `# Lighthouse — ${BASE_URL}`,
  "",
  `Gerado: ${new Date().toISOString()}`,
  "",
  "## Scores por rota",
  "",
  "| Rota | Mobile Perf | Desktop Perf | A11y (m/d) | BP (m/d) | SEO (m/d) | LCP mobile | LCP desktop |",
  "|------|-------------|--------------|------------|----------|-----------|------------|-------------|",
];

for (const route of routes) {
  const m = summary.find((r) => r.path === route && r.formFactor === "mobile");
  const d = summary.find((r) => r.path === route && r.formFactor === "desktop");
  md.push(
    `| ${route} | ${m?.performance ?? "—"} | ${d?.performance ?? "—"} | ${m?.accessibility ?? "—"}/${d?.accessibility ?? "—"} | ${m?.bestPractices ?? "—"}/${d?.bestPractices ?? "—"} | ${m?.seo ?? "—"}/${d?.seo ?? "—"} | ${m?.metrics["largest-contentful-paint"] ?? "—"} | ${d?.metrics["largest-contentful-paint"] ?? "—"} |`,
  );
}

if (errors.length) {
  md.push("", "## Erros", "");
  for (const e of errors) {
    md.push(`- ${e.route} (${e.suffix}): ${e.message}`);
  }
}

writeFileSync(join(OUT_DIR, "SUMMARY.md"), md.join("\n"));
console.log(`\nConcluído: ${summary.length} relatórios, ${errors.length} erros`);
console.log(`Resumo: ${join(OUT_DIR, "SUMMARY.md")}`);
