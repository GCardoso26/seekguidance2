/**
 * Bulk DS purge — UI-only class migrations (RC10 / 9.5 gate)
 * Skips components/luxury. Safe string replacements on className-ish content.
 */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");
const SKIP_DIRS = new Set(["luxury", "node_modules"]);

/** Order matters — longer / more specific first */
const REPLACEMENTS = [
  // Luxury surfaces
  [/luxury-card\b/g, "surface-card"],
  [/border-luxury-gold\/(\d+)/g, "border-primary/$1"],
  [/border-luxury-gold\b/g, "border-primary"],
  [/bg-luxury-gold\/(\d+)/g, "bg-primary/$1"],
  [/bg-luxury-gold\b/g, "bg-primary"],
  [/text-luxury-gold\b/g, "text-primary"],
  [/ring-luxury-gold\/(\d+)/g, "ring-primary/$1"],
  [/ring-luxury-gold\b/g, "ring-primary"],
  [/from-luxury-gold\/(\d+)/g, "from-primary/$1"],
  [/to-luxury-onyx\b/g, "to-background"],
  [/from-luxury-onyx\b/g, "from-background"],
  [/bg-luxury-onyx\b/g, "bg-background"],
  [/bg-luxury-obsidian\b/g, "bg-card"],
  [/bg-luxury-midnight\b/g, "bg-muted"],
  [/bg-luxury-velvet\b/g, "bg-accent"],
  [/text-luxury-frost\b/g, "text-foreground"],
  [/text-luxury-mist\b/g, "text-muted-foreground"],
  [/text-luxury-silver\b/g, "text-muted-foreground"],
  [/border-luxury-mist\b/g, "border-border"],
  [/fill-luxury-gold\b/g, "fill-primary"],

  // Primary/danger buttons that used text-white
  [/bg-primary([^\n"']*)\btext-white\b/g, "bg-primary$1text-primary-foreground"],
  [/bg-danger([^\n"']*)\btext-white\b/g, "bg-danger$1text-danger-foreground"],
  [/bg-success([^\n"']*)\btext-white\b/g, "bg-success$1text-success-foreground"],
  [/text-white([^\n"']*)\bbg-primary\b/g, "text-primary-foreground$1bg-primary"],

  // White / black hardcodes (theme-breaking)
  [/border-white\/5\b/g, "border-border/60"],
  [/border-white\/10\b/g, "border-border"],
  [/border-white\/15\b/g, "border-border"],
  [/border-white\/20\b/g, "border-border"],
  [/border-white\/30\b/g, "border-border"],
  [/divide-white\/5\b/g, "divide-border/60"],
  [/divide-white\/10\b/g, "divide-border"],
  [/bg-white\/\[0\.0[3-7]\]/g, "bg-muted/40"],
  [/bg-white\/5\b/g, "bg-muted/40"],
  [/bg-white\/10\b/g, "bg-muted/50"],
  [/bg-white\/15\b/g, "bg-muted/60"],
  [/hover:bg-white\/\[0\.0[3-7]\]/g, "hover:bg-muted/40"],
  [/hover:bg-white\/5\b/g, "hover:bg-muted/40"],
  [/hover:bg-white\/10\b/g, "hover:bg-muted/50"],
  [/hover:bg-white\/15\b/g, "hover:bg-muted/60"],
  [/hover:text-white\b/g, "hover:text-foreground"],
  [/text-white\/40\b/g, "text-muted-foreground/70"],
  [/text-white\/50\b/g, "text-muted-foreground"],
  [/text-white\/60\b/g, "text-muted-foreground"],
  [/text-white\/70\b/g, "text-muted-foreground"],
  [/text-white\/80\b/g, "text-foreground/80"],
  [/text-white\/90\b/g, "text-foreground"],
  // text-white alone — careful: keep on primary buttons via primary-foreground already
  [/(?<![-/])text-white(?!\/)/g, "text-foreground"],

  [/bg-black\/20\b/g, "bg-muted/50"],
  [/bg-black\/30\b/g, "bg-foreground/30"],
  [/bg-black\/40\b/g, "bg-foreground/40"],
  [/bg-black\/50\b/g, "bg-foreground/50"],
  [/bg-black\/60\b/g, "bg-foreground/50"],
  [/bg-black\/70\b/g, "bg-foreground/60"],
  [/bg-black\/80\b/g, "bg-foreground/70"],
  [/bg-black\/90\b/g, "bg-foreground/80"],

  // Arbitrary px type → tokens
  [/text-\[9px\]/g, "text-overline"],
  [/text-\[10px\]/g, "text-caption"],
  [/text-\[11px\]/g, "text-caption"],
  [/text-\[13px\]/g, "text-small"],

  // Common raw status colors → semantic (class fragments)
  [/text-red-400\b/g, "text-danger"],
  [/text-red-300\b/g, "text-danger"],
  [/text-red-500\b/g, "text-danger"],
  [/text-emerald-400\b/g, "text-success"],
  [/text-emerald-300\b/g, "text-success"],
  [/text-emerald-600\b/g, "text-success"],
  [/text-amber-200\b/g, "text-warning"],
  [/text-amber-400\b/g, "text-warning"],
  [/text-amber-500\b/g, "text-warning"],
  [/text-sky-300\b/g, "text-info"],
  [/text-blue-200\b/g, "text-info"],
  [/text-blue-400\b/g, "text-info"],
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let filesChanged = 0;
let totalSubs = 0;

for (const file of walk(ROOT)) {
  if (file.includes(`${path.sep}luxury${path.sep}`)) continue;
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  let fileSubs = 0;
  for (const [re, to] of REPLACEMENTS) {
    const before = text;
    text = text.replace(re, to);
    if (text !== before) {
      const m = before.match(re);
      fileSubs += m ? m.length : 1;
    }
  }
  if (text !== original) {
    fs.writeFileSync(file, text);
    filesChanged++;
    totalSubs += fileSubs;
    console.log(`updated ${path.relative(path.join(__dirname, ".."), file)} (~${fileSubs})`);
  }
}

console.log(`\nDone. Files: ${filesChanged}, approx substitutions: ${totalSubs}`);
