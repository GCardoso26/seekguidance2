#!/usr/bin/env node
const API = process.env.TEST_API || "https://seekguidance.onrender.com";

async function main() {
  console.log("=== Login API direta ===");
  let login;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin" }),
        signal: AbortSignal.timeout(120_000),
      });
      const text = await res.text();
      console.log(`attempt ${i + 1}:`, res.status, text.slice(0, 200));
      if (res.ok && text) {
        login = JSON.parse(text);
        break;
      }
    } catch (e) {
      console.log(`attempt ${i + 1} ERR`, e.message);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!login?.tokens?.access_token) {
    console.error("Falha no login API");
    process.exit(1);
  }
  const tok = login.tokens.access_token;
  console.log("role", login.user?.role);

  const tests = [
    ["GET", "/v1/health", null],
    ["GET", "/runtime/judge/catalog/health", null],
    ["GET", "/runtime/judge/catalog/games/mtg", null],
    ["POST", "/runtime/judge/catalog/games/mtg/sync?full=false", {}],
    ["POST", "/runtime/judge/catalog/games/pokemon/sync?full=false", {}],
    ["POST", "/runtime/judge/catalog/games/fab/sync?full=false", {}],
  ];

  for (const [method, path, body] of tests) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${tok}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(120_000),
      });
      const text = await res.text();
      console.log(`${method} ${path}`, res.status, `${Date.now() - t0}ms`, text.slice(0, 400));
    } catch (e) {
      console.log(`${method} ${path} ERR`, e.message, `${Date.now() - t0}ms`);
    }
  }
}

main();
