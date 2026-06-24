#!/usr/bin/env node
/**
 * Auditoria de cobertura de imagens via API de health do catálogo.
 * Uso: node scripts/audit-images.js [apiBase] [--sample=100] [--json]
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const API = (args.find((a) => !a.startsWith("--")) || "https://seekguidance.onrender.com").replace(/\/$/, "");
const SAMPLE_SIZE = Number(args.find((a) => a.startsWith("--sample="))?.split("=")[1] || 100);
const WRITE_JSON = args.includes("--json") || true;

async function fetchHealth(retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API}/runtime/judge/catalog/health`, {
        signal: AbortSignal.timeout(180000),
      });
      if (res.status === 502 || res.status === 503) {
        lastErr = new Error(`Health API ${res.status}`);
        await new Promise((r) => setTimeout(r, 15000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`Health API ${res.status}`);
      return res.json();
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 15000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function headCheck(url, timeoutMs = 5000) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
    return { ok: res.ok, status: res.status, elapsed: Date.now() - start };
  } catch (e) {
    return { ok: false, status: 0, elapsed: Date.now() - start, error: e.message };
  }
}

function coverageStatus(pct) {
  if (pct >= 95) return "ok";
  if (pct >= 50) return "warn";
  return "fail";
}

async function main() {
  console.log(`Auditoria de imagens — ${API}\n`);
  const health = await fetchHealth();

  console.log("Status:", health.status);
  console.log("Total cards:", health.total_cards);
  console.log("Ready for marketplace:", health.ready_for_marketplace);
  console.log("Meilisearch:", health.meilisearch ?? "—");

  const results = {};
  let totalCards = 0;
  let totalWithImage = 0;
  let totalMissing = 0;

  console.log("\nPor jogo:");
  for (const [game, count] of Object.entries(health.by_game || {})) {
    const missing = (health.missing_images || []).find((m) => m.game === game)?.count ?? 0;
    const withImage = Math.max(0, count - missing);
    const pct = count ? (withImage / count) * 100 : 0;
    const status = coverageStatus(pct);
    const icon = status === "ok" ? "✅" : status === "warn" ? "⚠️" : "❌";

    results[game] = { total: count, withImage, missing, coverage: Math.round(pct * 10) / 10, status };
    totalCards += count;
    totalWithImage += withImage;
    totalMissing += missing;

    console.log(`  ${icon} ${game.padEnd(12)} ${withImage}/${count} (${pct.toFixed(1)}%)`);
  }

  if (health.image_coverage) {
    console.log("\nVerificação HTTP (amostra da API):");
    for (const [game, info] of Object.entries(health.image_coverage)) {
      if (!info || typeof info !== "object") continue;
      const broken = info.broken ?? info.broken_urls ?? 0;
      const sampled = info.sampled ?? info.sample_size ?? 0;
      const slow = info.slow ?? 0;
      console.log(`  ${game}: ${broken}/${sampled} quebradas, ${slow} lentas`);
      if (results[game]) {
        results[game].httpSample = { broken, sampled, slow };
      }
    }
  }

  if ((health.missing_images || []).length) {
    console.log("\nSem imagem (detalhe):");
    for (const m of health.missing_images) {
      console.log(`  ${m.game}: ${m.count}`);
    }
  }

  if (health.last_sync && Object.keys(health.last_sync).length) {
    console.log("\nÚltimo sync:");
    for (const [game, ts] of Object.entries(health.last_sync)) {
      console.log(`  ${game}: ${ts}`);
    }
  }

  const overallPct = totalCards ? (totalWithImage / totalCards) * 100 : 0;
  const report = {
    timestamp: new Date().toISOString(),
    api: API,
    summary: {
      totalGames: Object.keys(health.by_game || {}).length,
      totalCards,
      totalWithImage,
      totalMissing,
      overallCoverage: Math.round(overallPct * 10) / 10,
      readyForMarketplace: health.ready_for_marketplace,
    },
    results,
    health: {
      status: health.status,
      meilisearch: health.meilisearch,
      missing_images: health.missing_images,
      image_coverage: health.image_coverage,
    },
  };

  if (WRITE_JSON) {
    const outPath = path.join(process.cwd(), "image-audit-report.json");
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Relatório salvo em ${outPath}`);
  }

  console.log("\n---");
  if (health.total_cards < 100) {
    console.log("⚠ Catálogo quase vazio. Rode sync completo.");
    process.exit(1);
  }
  if (totalMissing > 0) {
    console.log(`⚠ ${totalMissing} cartas sem imagem. Re-sync ou corrija adapters.`);
    process.exit(1);
  }
  if (overallPct < 95) {
    console.log(`⚠ Cobertura geral ${overallPct.toFixed(1)}% (< 95%).`);
    process.exit(1);
  }
  console.log("✓ Cobertura de imagens OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
