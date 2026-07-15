import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";

for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (!m || process.env[m[1]]) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] = v;
}

async function auth(browser, email, password) {
  const ctx = await browser.newContext();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const hostname = new URL(BASE).hostname;
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const chunks = createChunks(
    `sb-${projectRef}-auth-token`,
    `base64-${stringToBase64URL(
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      }),
    )}`,
  );
  await ctx.addCookies(
    chunks.map(({ name, value }) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    })),
  );
  return ctx;
}

const out = [];
const browser = await chromium.launch({ headless: true });

// Search probes
{
  const page = await browser.newPage();
  for (const q of ["Lightning", "Lightning Bolt", "bolt"]) {
    const r = await page.request.get(`${BASE}/api/catalog/cards/search?q=${encodeURIComponent(q)}&limit=5`);
    const body = await r.json();
    out.push({
      check: "search-api",
      q,
      status: r.status(),
      degraded: Boolean(body.degraded),
      cards: Array.isArray(body.cards) ? body.cards.length : 0,
      error: body.error || null,
    });
  }
  await page.goto(`${BASE}/loja/busca?q=Lightning+Bolt`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(8000);
  const text = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ");
  out.push({
    check: "search-ui",
    url: page.url(),
    hasUnavailable: /temporariamente indisponível|Catálogo temporariamente|tente novamente/i.test(text),
    hasResults: /\d+\s+resultado|Lightning|Bolt/i.test(text),
    hasEmptyTrue: /Nenhuma carta encontrada/i.test(text) && !/temporariamente indisponível/i.test(text),
    snip: text.slice(0, 450),
  });
  await page.close();
}

// Seller painel
{
  const ctx = await auth(browser, "test-seller@judgetcg.com", "TestSeller123!");
  const page = await ctx.newPage();
  await page.goto(`${BASE}/vendedor/painel`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  let text = "";
  let cleared = false;
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(1500);
    text = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ");
    // Exact hang phrase only — avoid matching "Painel" in final UI.
    if (!text.includes("Carregando painel") && !text.includes("Carregando loja")) {
      cleared = true;
      break;
    }
  }
  out.push({
    check: "seller-painel",
    cleared,
    hasShell: /Painel do Vendedor|Cadastrar loja|Sidebar|Dashboard|Anúncios|Estoque/i.test(text),
    stillLoading: /Carregando painel|Carregando loja/i.test(text),
    snip: text.slice(0, 400),
  });

  // KYC / account status
  const st = await page.request.get(`${BASE}/api/account/status`);
  out.push({ check: "account-status", status: st.status(), body: (await st.text()).slice(0, 250) });

  await page.goto(`${BASE}/completar-perfil`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(5000);
  const cp = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ");
  const inputs = await page.locator("input").count();
  out.push({
    check: "completar-perfil",
    inputs,
    stuckLoading: /Carregando…|Carregando\.\.\./i.test(cp) && inputs === 0,
    hasForm: /Completar perfil|CPF|Validar CPF/i.test(cp) && inputs > 0,
    snip: cp.slice(0, 350),
  });
  await ctx.close();
}

console.log(JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(root, "test-results/qa-sandbox/p0-verify.json"), JSON.stringify(out, null, 2));
await browser.close();
