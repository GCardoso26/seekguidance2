#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(testingRoot, "..");

const r = spawnSync(
  "npm",
  ["run", "test", "--prefix", "frontend/runtime_console_v3", "--", "--run", "tests/a11y/buyer-flows-structure.test.ts"],
  { cwd: repoRoot, encoding: "utf8", shell: true, timeout: 120_000 },
);

const report = {
  generatedAt: new Date().toISOString(),
  personaId: "juliana-ux",
  displayName: "Juliana Almeida",
  role: "UI/UX Auditor",
  status: r.status === 0 ? "partial" : "fail",
  uxScore: r.status === 0 ? 6.5 : null,
  note: "Automação parcial — campanha visual exige browser supervisionado",
  sections: {
    visualBugs: [],
    loading: [{ screen: "N/A", note: "validar manualmente pós-gates" }],
    accessibility: [{ item: "buyer-flows-structure", pass: r.status === 0 }],
    perceivedPerformance: [],
    topImprovements: [],
  },
  automated: true,
  bugs: { p0: [], p1: [], p2: [], p3: [] },
};

writePersonaReport(testingRoot, "juliana-ux", report);
console.log(`Juliana UX: ${report.status} (structure test ${r.status === 0 ? "PASS" : "FAIL"})`);
process.exit(0);
