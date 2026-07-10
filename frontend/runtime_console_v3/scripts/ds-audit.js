/**
 * ESLint plugin-lite: ban classes legado via regex em JSXAttribute.
 * Complementa eslint.config — script de auditoria CI.
 */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");
const BANNED = [
  { re: /\btext-white\b/g, id: "text-white", msg: "Use text-foreground / text-primary-foreground" },
  { re: /\bbg-black\//g, id: "bg-black/", msg: "Use bg-foreground/… ou bg-muted" },
  { re: /\bborder-white\//g, id: "border-white/", msg: "Use border-border" },
  { re: /\bluxury-gold\b/g, id: "luxury-gold", msg: "Use primary / tokens semânticos" },
  { re: /\bluxury-onyx\b/g, id: "luxury-onyx", msg: "Use background" },
  { re: /\bluxury-card\b/g, id: "luxury-card", msg: "Use surface-card / Card" },
  { re: /text-\[[0-9]+px\]/g, id: "text-[Npx]", msg: "Use text-caption / text-small / text-body" },
  { re: /\btext-primary-light\b/g, id: "text-primary-light", msg: "Use text-primary" },
];

const SKIP = new Set(["luxury", "node_modules"]);
const SKIP_FILES = new Set(["luxury-marketing.css", "design-tokens.css"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  if (file.includes(`${path.sep}luxury${path.sep}`)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const ban of BANNED) {
    const matches = text.match(ban.re);
    if (matches?.length) {
      hits.push({
        file: path.relative(path.join(__dirname, ".."), file),
        id: ban.id,
        count: matches.length,
        msg: ban.msg,
      });
    }
  }
}

const byId = {};
for (const h of hits) {
  byId[h.id] = (byId[h.id] || 0) + h.count;
}

console.log("Design System audit (RC10)");
console.log("─".repeat(50));
for (const [id, count] of Object.entries(byId).sort((a, b) => b[1] - a[1])) {
  console.log(`${id.padEnd(20)} ${String(count).padStart(5)}`);
}
console.log("─".repeat(50));
console.log(`Files with debt: ${new Set(hits.map((h) => h.file)).size}`);
console.log(`Total hits: ${hits.reduce((s, h) => s + h.count, 0)}`);

const reportPath = path.join(__dirname, "../lighthouse-reports/ds-audit.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ byId, hits }, null, 2));

const total = hits.reduce((s, h) => s + h.count, 0);
// Soft gate: fail if critical debt returns above threshold
if (total > 50) {
  console.error(`\nFAIL: DS debt ${total} > 50. Run scripts/ds-purge.js`);
  process.exit(1);
}
console.log("\nOK: DS debt within threshold (≤50).");
process.exit(0);
