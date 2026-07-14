const fs = require("fs");
const path = require("path");

const chunksDir = path.join(".next", "static", "chunks");
const chunks = fs
  .readdirSync(chunksDir)
  .map((f) => ({ f, size: fs.statSync(path.join(chunksDir, f)).size }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 50);

console.log("TOP 50 CHUNKS");
chunks.forEach((c, i) => {
  console.log(`${i + 1}. ${(c.size / 1024).toFixed(1)} KB — ${c.f}`);
});

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.name.endsWith(".css")) out.push({ f: path.relative(".next/static/css", p), size: fs.statSync(p).size });
  }
  return out;
}

const cssDir = path.join(".next", "static", "css");
if (fs.existsSync(cssDir)) {
  const css = walk(cssDir).sort((a, b) => b.size - a.size);
  console.log("\nCSS");
  css.forEach((c) => console.log(`${(c.size / 1024).toFixed(1)} KB — ${c.f}`));
  console.log(`TOTAL CSS ${(css.reduce((s, c) => s + c.size, 0) / 1024).toFixed(1)} KB`);
}
