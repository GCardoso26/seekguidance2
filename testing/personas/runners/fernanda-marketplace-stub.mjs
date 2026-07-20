#!/usr/bin/env node
import { manualReport, writePersonaReport } from "./lib/report.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");

const report = manualReport(
  "fernanda-marketplace",
  "Fernanda Rocha",
  "Marketplace QA",
  "pending_manual",
  "Liquidez, ofertas, confiança — notas qualitativas para MRB (Market Learning R5)",
  {
    marketplaceNotes: [],
    checklistDoc: "docs/testing/personas/fernanda-rocha-marketplace-qa.md",
  },
);

writePersonaReport(testingRoot, "fernanda-marketplace", report);
console.log(`Fernanda Marketplace: ${report.status}`);
process.exit(0);
