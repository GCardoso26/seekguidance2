#!/usr/bin/env node
/** Teste E2E: login + sync via BFF judgetcg.com.br */
const BASE = process.env.TEST_BASE || "https://judgetcg.com.br";
const API = process.env.TEST_API || "https://seekguidance.onrender.com";

async function main() {
  const jar = new Map();

  function storeCookies(res) {
    const raw = res.headers.getSetCookie?.() ?? [];
    for (const line of raw) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }

  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  async function bff(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    const c = cookieHeader();
    if (c) headers.Cookie = c;
    const res = await fetch(`${BASE}${path}`, { ...opts, headers });
    storeCookies(res);
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, body };
  }

  console.log("=== 1. Health API Render ===");
  try {
    const h = await fetch(`${API}/v1/health`, { signal: AbortSignal.timeout(90_000) });
    console.log("health", h.status, (await h.text()).slice(0, 120));
  } catch (e) {
    console.log("health ERR", e.message);
  }

  console.log("\n=== 2. Login BFF ===");
  const login = await bff("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  console.log("login", login.status, JSON.stringify(login.body));
  const access = jar.get("tcg_access");
  console.log("tcg_access", access ? `${access.slice(0, 40)}...` : "MISSING");

  console.log("\n=== 3. /api/auth/me ===");
  const me = await bff("/api/auth/me");
  console.log("me", me.status, JSON.stringify(me.body));

  console.log("\n=== 4. /api/auth/refresh ===");
  const refresh = await bff("/api/auth/refresh", { method: "POST" });
  console.log("refresh", refresh.status, JSON.stringify(refresh.body));

  const games = ["mtg", "pokemon", "yugioh", "lorcana", "onepiece", "fab", "digimon"];

  for (const slug of games) {
    console.log(`\n=== 5. Sync ${slug} full=false ===`);
    const t0 = Date.now();
    try {
      const sync = await bff(`/api/games/${slug}?full=false`, {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
      });
      console.log(`sync ${slug}`, sync.status, `${Date.now() - t0}ms`, JSON.stringify(sync.body)?.slice(0, 200));
    } catch (e) {
      console.log(`sync ${slug} ERR`, e.message, `${Date.now() - t0}ms`);
    }
  }

  if (access) {
    console.log("\n=== 6. Sync MTG direto na API (full=false) ===");
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/runtime/judge/catalog/games/mtg/sync?full=false`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(120_000),
      });
      const text = await res.text();
      console.log("direct mtg", res.status, `${Date.now() - t0}ms`, text.slice(0, 200));
    } catch (e) {
      console.log("direct mtg ERR", e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
