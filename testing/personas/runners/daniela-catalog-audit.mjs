#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { writePersonaReport } from "./lib/report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(testingRoot, "..");

const suites = [
  "src/catalog/providers/__tests__/gameConfigRegistry.test.ts",
  "src/catalog/providers/__tests__/providerLifecycle.test.ts",
  "src/catalog/validation/__tests__/validation.test.ts",
  "src/catalog/providers/lorcana/__tests__/LorcanaProvider.test.ts",
  "src/catalog/providers/pokemon/__tests__/PokemonProvider.test.ts",
];

const results = [];
for (const suite of suites) {
  const r = spawnSync("npm", ["run", "test", "--prefix", "services/api", "--", suite], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    timeout: 180_000,
  });
  results.push({ suite, pass: r.status === 0 });
}

const passCount = results.filter((x) => x.pass).length;
const catalogScore = Math.round((passCount / results.length) * 100);

const report = {
  generatedAt: new Date().toISOString(),
  personaId: "daniela-catalog",
  displayName: "Daniela Costa",
  role: "Catalog Specialist",
  status: passCount === results.length ? "pass" : passCount >= 3 ? "warn" : "fail",
  catalogScore,
  providerSuites: results,
  fieldsChecked: [
    "imagem",
    "coleção",
    "idioma",
    "acabamento",
    "raridade",
    "collector number",
    "legality",
    "variant",
    "foil",
    "reverse holo",
    "enchanted",
    "serialized",
    "atributos por jogo",
  ],
  note: "Validação profunda por provider exige campanha manual + staging",
  automated: true,
  bugs: {
    p0: results.filter((x) => !x.pass && x.suite.includes("validation")).map((s) => `FAIL ${s.suite}`),
    p1: results.filter((x) => !x.pass && !x.suite.includes("validation")).map((s) => `FAIL ${s.suite}`),
    p2: [],
    p3: [],
  },
};

writePersonaReport(testingRoot, "daniela-catalog", report);
console.log(`Daniela Catalog: score=${catalogScore} status=${report.status}`);
process.exit(0);
