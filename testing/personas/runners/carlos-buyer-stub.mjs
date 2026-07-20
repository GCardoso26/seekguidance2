#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manualReport, writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");

function readPersona(id) {
  const p = path.join(testingRoot, "reports", `persona-${id}-latest.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

const marina = readPersona("marina-seller");
const blocked = marina?.status === "blocked";

const report = manualReport(
  "carlos-buyer",
  "Carlos Henrique",
  "Buyer QA",
  blocked ? "blocked" : "pending_manual",
  blocked
    ? "Aguardar Marina + gates"
    : "Executar jornada buyer (busca → PDP → carrinho → checkout simulado)",
  {
    buyerReadiness: "unknown",
    checklistDoc: "docs/testing/personas/carlos-henrique-buyer-qa.md",
  },
);

writePersonaReport(testingRoot, "carlos-buyer", report);
console.log(`Carlos Buyer: ${report.status}`);
process.exit(0);
