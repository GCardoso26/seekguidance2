#!/usr/bin/env node
/** Cleanup CI — apaga manifests de testing/.seed e ponteiros FE. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(testingRoot, "..");

function assertGuard(op) {
  const r = spawnSync(process.execPath, [path.join(testingRoot, "guards", "assert-not-beta.mjs"), op], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    process.exit(r.status ?? 1);
  }
}

function rm(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`✓ removed ${path.relative(repoRoot, file)}`);
  }
}

function main() {
  assertGuard("cleanup");
  const seedDir = path.join(testingRoot, ".seed");
  if (fs.existsSync(seedDir)) {
    for (const f of fs.readdirSync(seedDir)) {
      if (f.endsWith(".json") || f.endsWith(".tmp")) rm(path.join(seedDir, f));
    }
  }
  rm(path.join(repoRoot, "frontend", "runtime_console_v3", "e2e", ".seed", "personas-pointer.json"));
  console.log("✓ cleanup-ci done");
}

main();
