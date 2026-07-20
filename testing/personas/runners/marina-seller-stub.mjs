#!/usr/bin/env node
/**
 * Marina Costa — Seller QA runner.
 * Evidência automatizada: Playwright seller-lifecycle (não inventa cobertura full-day).
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

function readAudit() {
  const p = path.join(testingRoot, "reports", "environment-audit-latest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const audit = readAudit();
const ready = audit?.readyForFunctionalQA === true;

if (!ready) {
  const report = {
    generatedAt: new Date().toISOString(),
    personaId: "marina-seller",
    displayName: "Marina Costa",
    role: "Seller QA",
    status: "blocked",
    reason: "Environment Audit não liberou QA funcional",
    automated: true,
    confidence: 0,
    coverageNote: "lifecycle E2E não executado",
    bugs: { p0: [], p1: [], p2: [], p3: [] },
  };
  writePersonaReport(testingRoot, "marina-seller", report);
  console.log("Marina Seller: blocked");
  process.exit(0);
}

console.log("Marina Seller: executando e2e lifecycle…");
const lifecycle = spawnSync("npm", ["run", "test:e2e:lifecycle"], {
  cwd: consoleRoot,
  env: {
    ...process.env,
    API_PROXY_TARGET: process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com",
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  },
  encoding: "utf8",
  shell: true,
  timeout: 300_000,
});

const passed = lifecycle.status === 0;
const out = `${lifecycle.stdout || ""}\n${lifecycle.stderr || ""}`;
const passedMatch = out.match(/(\d+) passed/);
const failedMatch = out.match(/(\d+) failed/);
const passedCount = passedMatch ? Number(passedMatch[1]) : 0;
const failedCount = failedMatch ? Number(failedMatch[1]) : passed ? 0 : 1;

const coveredFlows = [
  "login→dashboard",
  "cadastrar produto",
  "editar produto",
  "excluir produto",
  "atualizar estoque",
  "criar cupom",
  "pedido→status",
  "relatório",
];

const report = {
  generatedAt: new Date().toISOString(),
  personaId: "marina-seller",
  displayName: "Marina Costa",
  role: "Seller QA",
  status: passed ? "pass" : "fail",
  reason: passed
    ? `Seller lifecycle E2E PASS (${passedCount} tests) — cobertura parcial do dia de trabalho`
    : `Seller lifecycle E2E FAIL (failed=${failedCount}) — ver Playwright output`,
  automated: true,
  confidence: passed ? 78 : 25,
  coverageLevel: passed ? "partial" : "blocked",
  coverageNote:
    "Não cobre cadastro/KYC/PIX/avatar/banner/jogos SHADOW/OFF/publicação multi-estado/financeiro completo — só lifecycle serial com mocks.",
  coveredFlows: passed ? coveredFlows : [],
  evidence: {
    command: "npm run test:e2e:lifecycle",
    exitCode: lifecycle.status,
    passedCount,
    failedCount,
    tail: out.slice(-1200),
  },
  sellerReadiness: passed ? "partial_ready" : "blocked",
  checklistDoc: "docs/testing/personas/marina-costa-seller-qa.md",
  bugs: {
    p0: passed ? [] : ["seller_lifecycle_e2e_failed"],
    p1: [],
    p2: [],
    p3: [],
  },
};

writePersonaReport(testingRoot, "marina-seller", report);
console.log(`Marina Seller: ${report.status} (confidence=${report.confidence}%)`);
process.exit(0);
