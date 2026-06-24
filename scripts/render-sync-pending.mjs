#!/usr/bin/env node
const API = process.env.RENDER_API || "https://seekguidance.onrender.com";
const games = (process.env.GAMES || "SWU,FAB,RIFTBOUND,SORCERY,UARENA,DBFW,VANGUARD").split(",").filter(Boolean);

async function login() {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin" }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) return res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Login falhou");
}

async function syncGame(token, game) {
  const t0 = Date.now();
  const res = await fetch(`${API}/runtime/judge/catalog/sync/${game}?full=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(900_000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { detail: text };
  }
  return { game, status: res.status, seconds: ((Date.now() - t0) / 1000).toFixed(1), body };
}

async function main() {
  console.log(`API: ${API}`);
  const loginData = await login();
  const token = loginData.tokens?.access_token;
  if (!token) throw new Error("Sem access_token");
  console.log("Login OK, role:", loginData.user?.role);

  for (const game of games) {
    console.log(`\n=== Sync ${game} (full) ===`);
    try {
      const result = await syncGame(token, game);
      console.log(`HTTP ${result.status} (${result.seconds}s)`, JSON.stringify(result.body).slice(0, 500));
      if (result.status !== 200) process.exitCode = 1;
    } catch (e) {
      console.error(`ERR ${game}:`, e.message);
      process.exitCode = 1;
    }
  }

  const health = await fetch(`${API}/runtime/judge/catalog/health`, {
    signal: AbortSignal.timeout(120_000),
  });
  const h = await health.json();
  console.log("\n=== Health pós-sync ===");
  for (const game of games) {
    console.log(game, h.by_game?.[game] ?? 0);
  }
  console.log("total_cards", h.total_cards);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
