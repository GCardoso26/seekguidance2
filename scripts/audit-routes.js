#!/usr/bin/env node
/**
 * Verifica status HTTP das rotas públicas do Judge TCG.
 * Uso: node scripts/audit-routes.js [baseUrl]
 */
const BASE = (process.argv[2] || "https://judgetcg.com.br").replace(/\/$/, "");

/** Rotas que devem retornar 2xx/3xx. IDs fictícios são excluídos. */
const ROUTES = [
  "/",
  "/loja",
  "/loja/mtg",
  "/loja/mtg/busca",
  "/carrinho",
  "/checkout",
  "/vendedor/painel",
  "/vendedor/painel/listagens",
  "/vendedor/painel/vendas",
  "/vendedor/painel/estatisticas",
  "/vendedor/painel/configuracoes",
  "/comunidade/leaderboard",
  "/regras",
  "/regras/mtg",
  "/decks",
  "/decks/novo",
  "/perfil",
  "/perfil/colecao",
  "/perfil/pedidos",
  "/perfil/seguidos",
  "/admin/catalog",
  "/onboarding",
  "/pro",
];

const MAX_REDIRECTS = 8;

async function checkRoute(path) {
  const url = `${BASE}${path}`;
  const chain = [path];
  let current = url;

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const res = await fetch(current, { redirect: "manual" });
      const status = res.status;

      if (status >= 300 && status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return { path, status, ok: false, error: "redirect sem Location", chain };
        }
        const next = new URL(location, current);
        const nextPath = next.pathname + next.search;
        if (chain.includes(nextPath)) {
          return {
            path,
            status,
            ok: false,
            error: `loop de redirect: ${chain.join(" → ")} → ${nextPath}`,
            chain,
          };
        }
        chain.push(nextPath);
        current = next.href;
        continue;
      }

      const finalPath = new URL(current).pathname + new URL(current).search;
      return {
        path,
        status,
        ok: status >= 200 && status < 400,
        finalPath,
        chain: chain.length > 1 ? chain : undefined,
      };
    }
    return { path, status: 0, ok: false, error: "muitos redirects", chain };
  } catch (err) {
    return { path, status: 0, ok: false, error: String(err), chain };
  }
}

async function main() {
  console.log(`Auditoria de rotas — ${BASE}\n`);
  const results = await Promise.all(ROUTES.map(checkRoute));
  const failed = results.filter((r) => !r.ok);

  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    const redirect =
      r.finalPath && r.finalPath !== r.path ? ` → ${r.finalPath}` : "";
    const via = r.chain?.length ? ` [${r.chain.join(" → ")}]` : "";
    console.log(`${icon} ${r.status || "ERR"} ${r.path}${redirect}${via}`);
    if (r.error) console.log(`    ${r.error}`);
  }

  console.log(`\n${results.length} rotas | ${failed.length} falhas`);
  if (failed.some((r) => r.error?.includes("loop"))) {
    console.log("\n⚠ Loop detectado em /carrinho — deploy pendente da correção local.");
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
