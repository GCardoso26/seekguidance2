/**
 * Migração em massa: classes legadas → Design System v2
 * Uso: node scripts/migrate-ds-classes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

/** Ordem importa: padrões mais longos primeiro */
const REPLACEMENTS = [
  [/rounded-2xl border border-white\/10 bg-white\/5/g, "surface-card rounded-2xl"],
  [/rounded-xl border border-white\/10 bg-white\/5/g, "surface-card"],
  [/rounded-lg border border-white\/10 bg-white\/5/g, "surface-card rounded-lg"],
  [/border border-white\/10 bg-white\/5/g, "border border-border bg-card shadow-card"],
  [/border border-dashed border-white\/20/g, "border border-dashed border-border"],
  [/border border-white\/20/g, "border border-border"],
  [/border-white\/20/g, "border-border"],
  [/border-white\/10/g, "border-border"],
  [/hover:bg-white\/10/g, "hover:bg-muted"],
  [/hover:bg-white\/5/g, "hover:bg-muted/80"],
  [/bg-white\/10/g, "bg-muted"],
  [/bg-white\/5/g, "bg-muted/50"],
  [/bg-luxury-obsidian\/95/g, "bg-card/95"],
  [/bg-luxury-obsidian\/90/g, "bg-card/90"],
  [/bg-luxury-obsidian/g, "bg-card"],
  [/bg-luxury-onyx/g, "bg-background"],
  [/bg-luxury-midnight/g, "bg-muted"],
  [/bg-luxury-panel\.surface/g, "bg-card"],
  [/hover:border-luxury-gold\/40/g, "hover:border-primary/40"],
  [/hover:border-luxury-gold\/30/g, "hover:border-primary/30"],
  [/border-luxury-gold\/40/g, "border-primary/40"],
  [/border-luxury-gold\/30/g, "border-primary/30"],
  [/bg-luxury-gold\/20/g, "bg-primary/20"],
  [/bg-luxury-gold\/10/g, "bg-primary/10"],
  [/hover:bg-luxury-gold\/90/g, "hover:bg-primary/90"],
  [/hover:bg-luxury-gold/g, "hover:bg-primary/90"],
  [/bg-luxury-gold/g, "bg-primary"],
  [/hover:text-luxury-gold/g, "hover:text-primary"],
  [/text-luxury-gold/g, "text-primary"],
  [/text-luxury-frost/g, "text-foreground"],
  [/text-luxury-mist/g, "text-muted-foreground"],
  [/text-luxury-silver/g, "text-muted-foreground"],
  [/text-luxury-onyx/g, "text-primary-foreground"],
  [/divide-white\/10/g, "divide-border"],
  [/ring-white\/10/g, "ring-border"],
  [/from-luxury-onyx/g, "from-background"],
  [/to-luxury-obsidian/g, "to-card"],
  [/via-luxury-obsidian/g, "via-card"],
];

const SKIP_DIRS = new Set(["node_modules", ".next"]);
const EXT = new Set([".tsx", ".ts", ".css"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function migrate(content) {
  let next = content;
  let count = 0;
  for (const [re, replacement] of REPLACEMENTS) {
    const matches = next.match(re);
    if (matches) {
      count += matches.length;
      next = next.replace(re, replacement);
    }
  }
  return { next, count };
}

const files = walk(SRC);
let totalFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  // Preservar luxury-marketing.css (páginas marketing com identidade própria)
  if (file.endsWith("luxury-marketing.css")) continue;

  const original = fs.readFileSync(file, "utf8");
  const { next, count } = migrate(original);
  if (count > 0) {
    fs.writeFileSync(file, next, "utf8");
    totalFiles++;
    totalReplacements += count;
    console.log(`${count.toString().padStart(4)}  ${path.relative(SRC, file)}`);
  }
}

console.log(`\n✓ ${totalReplacements} substituições em ${totalFiles} arquivos`);
