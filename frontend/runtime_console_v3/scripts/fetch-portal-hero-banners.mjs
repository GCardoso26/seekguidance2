#!/usr/bin/env node
/**
 * Fetch 3 recent sealed packshots per wave game (excl. Lorcana) for portal hero banners.
 * Source: TCGCSV → TCGplayer CDN (ADR-016: packshot, not set icon).
 *
 * Usage: node scripts/fetch-portal-hero-banners.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_BASE = path.join(ROOT, "public", "logos", "sets");
const TCGCSV = "https://tcgcsv.com/tcgplayer";
const UA = "JudgeTCG/portal-banners (https://judgetcg.com.br)";

const GAMES = [
  { gameId: "MTG", slug: "mtg", categoryId: 1 },
  { gameId: "POKEMON", slug: "pokemon", categoryId: 3 },
  { gameId: "YGO", slug: "yugioh", categoryId: 2 },
  { gameId: "ONEPIECE", slug: "onepiece", categoryId: 68 },
  { gameId: "DIGIMON", slug: "digimon", categoryId: 63 },
  { gameId: "DBFW", slug: "dbfw", categoryId: 80 },
  { gameId: "RIFTBOUND", slug: "riftbound", categoryId: 89 },
  { gameId: "FAB", slug: "fab", categoryId: 62 },
  { gameId: "GUNDAM", slug: "gundam", categoryId: 86 },
  { gameId: "SORCERY", slug: "sorcery", categoryId: 77 },
];

/** Strict sealed keywords — avoid matching singles named "Collection" etc. */
const SEALED_RE =
  /booster box|booster pack|\bdisplay\b|elite trainer|\betb\b|starter deck|structure deck|preconstructed|commander deck|deck set|gift box|booster case|\btin\b|blister|prerelease kit|illumineer's|trove|bundle(?! card)/i;

function cdnCandidates(productId, imageUrl) {
  const id = Number(productId);
  const list = [
    `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`,
    `https://tcgplayer-cdn.tcgplayer.com/product/${id}_400w.jpg`,
    `https://tcgplayer-cdn.tcgplayer.com/product/${id}_200w.jpg`,
  ];
  if (imageUrl && /^https:\/\//i.test(imageUrl)) list.push(imageUrl);
  return list;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function pickSealedProducts(categoryId, limit = 12) {
  const groupsBody = await getJson(`${TCGCSV}/${categoryId}/groups`);
  const groups = [...(groupsBody.results || [])]
    .filter((g) => g.groupId != null)
    .sort((a, b) => String(b.publishedOn || "").localeCompare(String(a.publishedOn || "")));

  const picked = [];
  for (const g of groups) {
    if (picked.length >= limit) break;
    let prodsBody;
    try {
      prodsBody = await getJson(`${TCGCSV}/${categoryId}/${g.groupId}/products`);
    } catch {
      continue;
    }
    for (const p of prodsBody.results || []) {
      if (picked.length >= limit) break;
      const name = String(p.name || p.cleanName || "");
      const id = Number(p.productId);
      if (!id || !name || !SEALED_RE.test(name) || !p.imageUrl) continue;
      picked.push({ productId: id, name, groupName: g.name, imageUrl: p.imageUrl });
    }
  }
  return picked;
}

async function downloadFirstOk(urls, dest) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("image") && !url.includes("tcgplayer-cdn")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) continue;
      await writeFile(dest, buf);
      return { url, bytes: buf.length };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function main() {
  const summary = [];
  for (const game of GAMES) {
    const dir = path.join(OUT_BASE, game.slug);
    await mkdir(dir, { recursive: true });
    console.log(`\n== ${game.gameId} (cat ${game.categoryId}) ==`);
    const candidates = await pickSealedProducts(game.categoryId, 24);
    const saved = [];
    for (const p of candidates) {
      if (saved.length >= 3) break;
      const file = `${game.slug}_banner_${saved.length + 1}.jpg`;
      const dest = path.join(dir, file);
      const result = await downloadFirstOk(cdnCandidates(p.productId, p.imageUrl), dest);
      if (!result) {
        console.warn(`  skip ${p.productId} ${p.name.slice(0, 40)} (no downloadable image)`);
        continue;
      }
      console.log(`  ${file} ← ${p.name.slice(0, 55)} (${result.bytes} B)`);
      saved.push({
        path: `/logos/sets/${game.slug}/${file}`,
        name: p.name,
        source: result.url,
      });
    }
    if (saved.length < 3) {
      console.warn(`  warn: only ${saved.length}/3 banners for ${game.gameId}`);
    }
    summary.push({
      gameId: game.gameId,
      slug: game.slug,
      paths: saved.map((s) => s.path),
      products: saved.map((s) => s.name),
    });
  }
  const metaPath = path.join(OUT_BASE, "portal-hero-banners.meta.json");
  await writeFile(metaPath, JSON.stringify({ generatedAt: new Date().toISOString(), games: summary }, null, 2));
  console.log(`\nWrote ${metaPath}`);
  const incomplete = summary.filter((g) => g.paths.length < 3);
  if (incomplete.length) {
    console.error("Incomplete games:", incomplete.map((g) => g.gameId).join(", "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
