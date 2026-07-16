import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const dir = path.join(root, "test-results", "qa-sandbox");
fs.mkdirSync(dir, { recursive: true });

for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (!m || process.env[m[1]]) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] = v;
}

const out = [];

async function dump(page, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  const inputs = await page.locator("input").evaluateAll((els) =>
    els.map((e) => ({
      type: e.type,
      name: e.name,
      id: e.id,
      placeholder: e.placeholder,
      aria: e.getAttribute("aria-label"),
      visible: !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length),
    })),
  );
  const buttons = await page
    .locator("button")
    .evaluateAll((els) => els.slice(0, 25).map((e) => e.innerText.trim().slice(0, 60)));
  const text = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 800);
  out.push({ name, url: page.url(), inputs, buttons, text });
}

async function authContext(browser, email, password) {
  const ctx = await browser.newContext();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const hostname = new URL(BASE).hostname;
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: data.session.user,
  });
  const encoded = `base64-${stringToBase64URL(sessionJson)}`;
  const chunks = createChunks(cookieName, encoded);
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

const browser = await chromium.launch({ headless: true });

// Entrar
{
  const page = await browser.newPage();
  await page.goto(BASE + "/entrar", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);
  await dump(page, "entrar-initial");
  const toggle = page.getByRole("button", { name: /registre|criar conta|já tem conta|entrar/i });
  const n = await toggle.count();
  out.push({ name: "entrar-toggle-count", n });
  if (n) {
    await toggle.first().click().catch(() => {});
    await page.waitForTimeout(800);
    await dump(page, "entrar-toggled");
  }
  // invalid login attempt with whatever inputs exist
  const email = page.locator("input[type=email]").first();
  const pass = page.locator("input[type=password]").first();
  out.push({
    name: "entrar-input-counts",
    email: await email.count(),
    pass: await pass.count(),
    emailVisible: (await email.count()) ? await email.isVisible().catch(() => false) : false,
  });
  if ((await email.count()) && (await pass.count())) {
    await email.fill("bad-user@example.com");
    await pass.fill("WrongPass123!");
    await page.getByRole("button", { name: /entrar com e-mail|entrar|criar/i }).first().click();
    await page.waitForTimeout(2000);
    await dump(page, "entrar-bad-creds");
  }
  await page.close();
}

// Search guest / api
{
  const page = await browser.newPage();
  const api = await page.request.get(BASE + "/api/catalog/cards/search?q=Lightning");
  out.push({ name: "api-search", status: api.status(), body: (await api.text()).slice(0, 400) });
  await page.goto(BASE + "/loja/busca?q=Lightning+Bolt", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const linkCount = await page.locator("a[href*='/loja/'], a[href*='/cards/'], a[href*='/marketplace/']").count();
  await dump(page, "busca-guest");
  out.push({ name: "busca-guest-links", linkCount });
  await page.close();
}

// Buyer PDP path
{
  const ctx = await authContext(browser, "test-buyer@judgetcg.com", "TestBuyer123!");
  const page = await ctx.newPage();
  await page.goto(BASE + "/loja/busca?q=Lightning", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await dump(page, "busca-buyer");
  const product = page.locator("a[href*='/cards/'], a[href*='/marketplace/product'], a[href*='/loja/mtg/']").first();
  if (await product.count()) {
    const href = await product.getAttribute("href");
    await product.click({ force: true });
    await page.waitForTimeout(2500);
    out.push({ name: "pdp-href", href, url: page.url() });
    await dump(page, "pdp-buyer");
    const add = page.getByRole("button", { name: /adicionar|comprar|carrinho|ver ofertas/i }).first();
    out.push({ name: "pdp-cta-count", count: await add.count() });
    if (await add.count()) {
      await add.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      await dump(page, "pdp-after-cta");
    }
  } else {
    out.push({ name: "pdp-buyer", error: "no product link" });
  }
  await page.goto(BASE + "/completar-perfil");
  await page.waitForTimeout(1000);
  await dump(page, "completar-perfil");
  await ctx.close();
}

// Seller forms
{
  const ctx = await authContext(browser, "test-seller@judgetcg.com", "TestSeller123!");
  const page = await ctx.newPage();
  for (const p of [
    "/vendedor/painel",
    "/vendedor/painel/listagens",
    "/vendedor/painel/listagens/nova",
    "/vendedor/painel/estoque",
    "/vendedor/painel/estoque/importacao",
  ]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);
    await dump(page, "seller" + p.replace(/\W+/g, "_"));
  }
  // sandbox badge visibility on store
  await page.goto(BASE + "/loja");
  await page.waitForTimeout(1500);
  const body = await page.locator("body").innerText();
  out.push({
    name: "sandbox-badge-loja",
    hasSandbox: /SANDBOX/i.test(body),
    snippet: body.replace(/\s+/g, " ").slice(0, 300),
  });
  await ctx.close();
}

fs.writeFileSync(path.join(dir, "deep-dive.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
