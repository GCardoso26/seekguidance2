/**
 * Bulk fix text-primary-light → text-primary (invalid token)
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "../src");
const SKIP = new Set(["luxury"]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(f);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  let t = fs.readFileSync(file, "utf8");
  const o = t;
  t = t.replace(/text-primary-light\b/g, "text-primary");
  if (t !== o) {
    fs.writeFileSync(file, t);
    n++;
    console.log(path.relative(path.join(__dirname, ".."), file));
  }
}
console.log("updated", n);
