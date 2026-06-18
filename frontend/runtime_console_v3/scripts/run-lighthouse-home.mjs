import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "lighthouse-reports");
const LH = join(ROOT, "node_modules", "lighthouse", "cli", "index.js");
const METRICS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "interactive",
  "speed-index",
];

function parse(file) {
  const d = JSON.parse(readFileSync(file, "utf8"));
  const row = {
    path: "/",
    formFactor: d.configSettings?.formFactor,
    fetchTime: d.fetchTime,
    performance: null,
    accessibility: null,
    bestPractices: null,
    seo: null,
    metrics: {},
  };
  for (const [k, v] of Object.entries(d.categories || {})) {
    if (v.score == null) continue;
    const s = Math.round(v.score * 100);
    if (k === "performance") row.performance = s;
    else if (k === "accessibility") row.accessibility = s;
    else if (k === "best-practices") row.bestPractices = s;
    else if (k === "seo") row.seo = s;
  }
  for (const k of METRICS) {
    const a = d.audits?.[k];
    if (a?.displayValue) row.metrics[k] = a.displayValue;
  }
  return row;
}

for (const [preset, suffix] of [
  ["perf", "mobile"],
  ["desktop", "desktop"],
]) {
  const out = join(OUT, `home-${suffix}.json`);
  execFileSync(
    process.execPath,
    [
      LH,
      "https://judgetcg.com.br/",
      "--quiet",
      `--preset=${preset}`,
      "--chrome-flags=--headless=new",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${out}`,
    ],
    { stdio: "inherit", cwd: ROOT },
  );
}

const summary = JSON.parse(readFileSync(join(OUT, "summary.json"), "utf8"));
summary.routes = ["/", ...summary.routes.filter((r) => r !== "/")];
summary.summary = summary.summary.filter((r) => r.path !== "/");
summary.summary.unshift(parse(join(OUT, "home-desktop.json")));
summary.summary.unshift(parse(join(OUT, "home-mobile.json")));
writeFileSync(join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

const m = summary.summary.find((r) => r.path === "/" && r.formFactor === "mobile");
const d = summary.summary.find((r) => r.path === "/" && r.formFactor === "desktop");
const row = `| / | ${m?.performance ?? "—"} | ${d?.performance ?? "—"} | ${m?.accessibility ?? "—"}/${d?.accessibility ?? "—"} | ${m?.bestPractices ?? "—"}/${d?.bestPractices ?? "—"} | ${m?.seo ?? "—"}/${d?.seo ?? "—"} | ${m?.metrics["largest-contentful-paint"] ?? "—"} | ${d?.metrics["largest-contentful-paint"] ?? "—"} |`;
const lines = readFileSync(join(OUT, "SUMMARY.md"), "utf8").split("\n");
if (!lines.some((l) => l.startsWith("| / |"))) {
  lines.splice(8, 0, row);
  writeFileSync(join(OUT, "SUMMARY.md"), lines.join("\n"));
}
console.log("Home mobile/desktop perf:", m?.performance, d?.performance);
