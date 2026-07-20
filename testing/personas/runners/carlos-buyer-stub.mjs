#!/usr/bin/env node
/**
 * Carlos Henrique — Buyer QA runner.
 * Executa Playwright buyer-lifecycle e grava evidências em testing/reports/persona-carlos/.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(testingRoot, "..");
const consoleRoot = path.join(repoRoot, "frontend", "runtime_console_v3");
const evidenceDir = path.join(testingRoot, "reports", "persona-carlos");

function readAudit() {
  const p = path.join(testingRoot, "reports", "environment-audit-latest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const audit = readAudit();
const ready = audit?.readyForFunctionalQA === true;
fs.mkdirSync(evidenceDir, { recursive: true });

if (!ready) {
  const report = {
    generatedAt: new Date().toISOString(),
    personaId: "carlos-buyer",
    displayName: "Carlos Henrique",
    role: "Buyer QA",
    status: "blocked",
    reason: "Environment Audit não liberou QA funcional",
    automated: true,
    confidence: 0,
    coverageLevel: "blocked",
    bugs: { p0: [], p1: [], p2: [], p3: [] },
  };
  writePersonaReport(testingRoot, "carlos-buyer", report);
  console.log("Carlos Buyer: blocked");
  process.exit(0);
}

console.log("Carlos Buyer: executando buyer-lifecycle E2E…");
const e2e = spawnSync(
  "npx",
  ["playwright", "test", "e2e/specs/buyer-lifecycle.spec.ts", "--project=chromium"],
  {
    cwd: consoleRoot,
    env: {
      ...process.env,
      API_PROXY_TARGET: process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com",
      BASE_URL: process.env.BASE_URL || "http://localhost:3000",
      NEXT_PUBLIC_CHECKOUT_V2: process.env.NEXT_PUBLIC_CHECKOUT_V2 || "1",
    },
    encoding: "utf8",
    shell: true,
    timeout: 300_000,
  },
);

const passed = e2e.status === 0;
const out = `${e2e.stdout || ""}\n${e2e.stderr || ""}`;
const passedMatch = out.match(/(\d+) passed/);
const failedMatch = out.match(/(\d+) failed/);
const passedCount = passedMatch ? Number(passedMatch[1]) : 0;
const failedCount = failedMatch ? Number(failedMatch[1]) : passed ? 0 : 1;

fs.writeFileSync(
  path.join(evidenceDir, "latest-run.txt"),
  out.slice(-4000),
  "utf8",
);

const coveredFlows = [
  "search",
  "marketplace",
  "wishlist",
  "cart",
  "checkout-page",
  "orders-history",
];

/** Parcial até PIX/card real end-to-end no FE V2 (Fase 1 continua). */
const confidence = passed ? 72 : 30;

const report = {
  generatedAt: new Date().toISOString(),
  personaId: "carlos-buyer",
  displayName: "Carlos Henrique",
  role: "Buyer QA",
  status: passed ? "pass" : "fail",
  reason: passed
    ? `Buyer lifecycle E2E PASS (${passedCount}) — páginas críticas; checkout V2 API wiring em progresso`
    : `Buyer lifecycle E2E FAIL (failed=${failedCount})`,
  automated: true,
  confidence,
  coverageLevel: "partial",
  coverageNote:
    "Não cobre ainda: cadastro/recuperação senha/avaliação/recompra/pagamento PSP real sem simulate — ver plano Beta sprint.",
  coveredFlows: passed ? coveredFlows : [],
  evidenceDir: "testing/reports/persona-carlos",
  evidence: {
    command: "npx playwright test e2e/specs/buyer-lifecycle.spec.ts",
    exitCode: e2e.status,
    passedCount,
    failedCount,
  },
  bugs: {
    p0: passed ? [] : ["buyer_lifecycle_e2e_failed"],
    p1: [],
    p2: [],
    p3: [],
  },
};

writePersonaReport(testingRoot, "carlos-buyer", report);
console.log(`Carlos Buyer: ${report.status} (confidence=${report.confidence}%)`);
process.exit(0);
