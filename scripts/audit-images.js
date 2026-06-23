#!/usr/bin/env node
/**
 * Auditoria de cobertura de imagens via API de health do catálogo.
 * Uso: node scripts/audit-images.js [apiBase]
 */
const API = (process.argv[2] || "https://seekguidance.onrender.com").replace(/\/$/, "");

async function fetchHealth() {
  const res = await fetch(`${API}/runtime/judge/catalog/health`, {
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Health API ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`Auditoria de imagens — ${API}\n`);
  const health = await fetchHealth();

  console.log("Status:", health.status);
  console.log("Total cards:", health.total_cards);
  console.log("Ready for marketplace:", health.ready_for_marketplace);
  console.log("Meilisearch:", health.meilisearch ?? "—");

  console.log("\nPor jogo:");
  let totalMissing = 0;
  for (const [game, count] of Object.entries(health.by_game || {})) {
    const missing = (health.missing_images || []).find((m) => m.game === game)?.count ?? 0;
    totalMissing += missing;
    const withImage = Math.max(0, count - missing);
    const pct = count ? ((withImage / count) * 100).toFixed(1) : "—";
    console.log(`  ${game}: ${withImage}/${count} (${pct}%)`);
  }

  if ((health.missing_images || []).length) {
    console.log("\nSem imagem:");
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

  console.log("\n---");
  if (health.total_cards < 100) {
    console.log("⚠ Catálogo quase vazio. Rode sync completo:");
    console.log("  1. Login admin em https://judgetcg.com.br/admin/catalog");
    console.log("  2. Clique 'Sync completo' em cada TCG (ou POST /runtime/judge/catalog/sync?full=true)");
    process.exit(1);
  }
  if (totalMissing > 0) {
    console.log(`⚠ ${totalMissing} cartas sem imagem. Re-sync ou corrija adapters.`);
    process.exit(1);
  }
  console.log("✓ Cobertura de imagens OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
