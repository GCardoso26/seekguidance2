import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:3000";
const dir = path.join(root, "test-results", "qa-sandbox");

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
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: data.session.user,
  });
  const chunks = createChunks(cookieName, `base64-${stringToBase64URL(sessionJson)}`);
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
const ctx = await auth(browser, "test-seller@judgetcg.com", "TestSeller123!");
const page = await ctx.newPage();

await page.goto(BASE + "/stores/create", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const suffix = Date.now().toString().slice(-6);
await page.locator("#name").fill(`QA Store ${suffix}`);
await page.waitForTimeout(300);
await page.locator("#slug").fill(`qa-store-${suffix}`);
await page.locator("#description").fill("Loja QA E2E sandbox").catch(async () => {
  await page.locator("textarea").first().fill("Loja QA E2E sandbox");
});
await page.locator("#city").fill("Osasco").catch(async () => {
  await page.getByLabel(/cidade/i).fill("Osasco");
});
await page.locator("#country").fill("BR").catch(() => {});
await page.locator("#email").fill(`qa-store-${suffix}@judgetcg-test.com`).catch(async () => {
  await page.locator('input[type=email]').fill(`qa-store-${suffix}@judgetcg-test.com`);
});

await page.screenshot({ path: path.join(dir, "store-filled.png") });
out.push({
  name: "filled",
  values: {
    name: await page.locator("#name").inputValue().catch(() => null),
    slug: await page.locator("#slug").inputValue().catch(() => null),
  },
  text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 500),
});

const reqs = [];
page.on("response", async (res) => {
  if (res.url().includes("/api/") && (res.request().method() === "POST" || res.url().includes("store"))) {
    reqs.push({ url: res.url(), status: res.status(), method: res.request().method(), body: (await res.text().catch(() => "")).slice(0, 300) });
  }
});

await page.getByRole("button", { name: /cadastrar loja/i }).click();
await page.waitForTimeout(5000);
out.push({
  name: "after-submit",
  url: page.url(),
  reqs,
  text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 800),
});
await page.screenshot({ path: path.join(dir, "store-after-submit.png") });

// completar perfil as seller
await page.goto(BASE + "/completar-perfil");
await page.waitForTimeout(8000);
out.push({
  name: "completar-perfil-seller",
  url: page.url(),
  inputs: await page.locator("input").count(),
  text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 600),
});
await page.screenshot({ path: path.join(dir, "completar-perfil-seller.png") });

// catalog health vs search comparison
const page2 = await browser.newPage();
for (const ep of [
  "/api/catalog/health",
  "/api/catalog/cards/search?q=bolt&limit=5",
  "/api/catalog/cards/search?q=Lightning%20Bolt",
]) {
  const r = await page2.request.get(BASE + ep);
  out.push({ ep, status: r.status(), body: (await r.text()).slice(0, 350) });
}
await page2.close();

fs.writeFileSync(path.join(dir, "round4.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await ctx.close();
await browser.close();
