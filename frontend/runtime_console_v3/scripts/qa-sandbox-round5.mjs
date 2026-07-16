import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://localhost:3000";
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
const ctx = await auth(browser, "test-seller@judgetcg.com", "TestSeller123!");
const page = await ctx.newPage();

await page.goto(BASE + "/completar-perfil", { waitUntil: "domcontentloaded" });
await page.waitForSelector("input", { timeout: 15000 });

for (const cpf of ["11111111111", "123", "00000000000", "52998224725"]) {
  const input = page.locator("input").first();
  await input.click();
  await input.fill("");
  await input.pressSequentially(cpf, { delay: 20 });
  await page.waitForTimeout(400);
  const disabled = await page.getByRole("button", { name: /validar cpf/i }).isDisabled();
  let after = "";
  if (!disabled) {
    await page.getByRole("button", { name: /validar cpf/i }).click();
    await page.waitForTimeout(3000);
    after = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 400);
  }
  out.push({ cpf, disabled, after, url: page.url() });
}

const traffic = [];
page.on("response", async (res) => {
  if (res.url().includes("/api/stores")) {
    traffic.push({
      method: res.request().method(),
      status: res.status(),
      url: res.url(),
      body: (await res.text().catch(() => "")).slice(0, 400),
    });
  }
});

await page.goto(BASE + "/stores/create");
await page.waitForTimeout(1500);
const suffix = Date.now().toString().slice(-5);
await page.locator("#name").fill(`QA Loja ${suffix}`);
await page.locator("#slug").fill(`qa-loja-${suffix}`);
await page.locator("textarea").first().fill("Desc QA");
await page.locator("#city").fill("Osasco");
await page.locator("#email").fill(`qa${suffix}@test.com`);
await page.getByRole("button", { name: /cadastrar loja/i }).click();
await page.waitForTimeout(12000);
out.push({
  store: {
    url: page.url(),
    btn: await page.getByRole("button", { name: /cadastrar|criando/i }).innerText().catch(() => "?"),
    text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 700),
    traffic,
  },
});

fs.writeFileSync(path.join(root, "test-results/qa-sandbox/round5.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
