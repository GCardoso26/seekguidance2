#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manualReport, writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");

function readAudit() {
  const p = path.join(testingRoot, "reports", "environment-audit-latest.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const audit = readAudit();
const ready = audit?.readyForFunctionalQA === true;

const report = manualReport(
  "marina-seller",
  "Marina Costa",
  "Seller QA",
  ready ? "pending_manual" : "blocked",
  ready
    ? "Gates OK — executar campanha curta/média (Playwright ou supervisionado)"
    : "Environment Audit não liberou QA funcional",
  {
    sellerReadiness: ready ? "unknown" : "blocked",
    campaign: { short: "20-30min", medium: "60-90min", long: "2-3h supervisionada" },
    checklistDoc: "docs/testing/personas/marina-costa-seller-qa.md",
  },
);

writePersonaReport(testingRoot, "marina-seller", report);
console.log(`Marina Seller: ${report.status}`);
process.exit(0);
