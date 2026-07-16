import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const out = [];
const browser = await chromium.launch({ headless: true });

{
  const page = await browser.newPage();
  for (const ep of [
    "/api/catalog/cards/search?q=Lightning",
    "/api/account/status",
    "/api/sandbox/status",
    "/api/catalog/sets",
  ]) {
    const r = await page.request.get(BASE + ep);
    out.push({ ep, status: r.status(), body: (await r.text()).slice(0, 300) });
    await page.waitForTimeout(1000);
  }
  await page.close();
}

{
  const page = await browser.newPage();
  await page.goto(BASE + "/stores/create", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  out.push({
    name: "stores-create-guest",
    url: page.url(),
    text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 500),
  });
  await page.screenshot({ path: path.join(dir, "stores-create-guest.png") });
  await page.close();
}

{
  const ctx = await auth(browser, "test-seller@judgetcg.com", "TestSeller123!");
  const page = await ctx.newPage();
  await page.goto(BASE + "/stores/create", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const inputs = await page.locator("input,textarea,select").evaluateAll((els) =>
    els.map((e) => ({
      tag: e.tagName,
      type: e.type,
      name: e.name,
      placeholder: e.placeholder,
      required: e.required,
    })),
  );
  out.push({
    name: "stores-create-seller",
    url: page.url(),
    inputs,
    text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 700),
  });
  await page.screenshot({ path: path.join(dir, "stores-create-seller.png") });

  const btn = page.getByRole("button", { name: /cadastrar loja/i });
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(800);
    out.push({
      name: "stores-empty-submit",
      text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 500),
    });

    const vis = page.locator("input:visible, textarea:visible");
    const n = await vis.count();
    for (let i = 0; i < n; i++) {
      const t = await vis.nth(i).getAttribute("type");
      if (t === "hidden" || t === "checkbox" || t === "file") continue;
      await vis.nth(i).fill("bad value @@");
    }
    await btn.click();
    await page.waitForTimeout(1500);
    out.push({
      name: "stores-invalid-submit",
      text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 600),
    });
    await page.screenshot({ path: path.join(dir, "stores-invalid-submit.png") });

    const suffix = Date.now().toString().slice(-6);
    const fields = {
      name: `QA Store ${suffix}`,
      slug: `qa-store-${suffix}`,
      description: "Loja criada pelo QA E2E sandbox",
      city: "Osasco",
      state: "SP",
      email: "qa-store@judgetcg-test.com",
      phone: "11999999999",
      cnpj: "58477778000176",
    };
    for (const [k, v] of Object.entries(fields)) {
      const el = page.locator(`input[name="${k}"], textarea[name="${k}"]`);
      if (await el.count()) await el.fill(v);
    }
    for (let i = 0; i < n; i++) {
      const el = vis.nth(i);
      const name = (await el.getAttribute("name")) || "";
      const t = await el.getAttribute("type");
      if (t === "checkbox" || t === "file" || t === "hidden") continue;
      const val = await el.inputValue().catch(() => "");
      if (!val || val.includes("bad value")) {
        if (fields[name]) await el.fill(fields[name]);
        else if (name) await el.fill("QA");
      }
    }
    await btn.click();
    await page.waitForTimeout(5000);
    out.push({
      name: "stores-valid-submit",
      url: page.url(),
      text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 800),
    });
    await page.screenshot({ path: path.join(dir, "stores-valid-submit.png") });
  } else {
    out.push({
      name: "stores-no-button",
      text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 500),
    });
  }

  await page.goto(BASE + "/vendedor/painel");
  await page.waitForTimeout(10000);
  out.push({
    name: "painel-after-cooldown",
    url: page.url(),
    text: ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 600),
  });
  await page.screenshot({ path: path.join(dir, "painel-after-cooldown.png") });

  // account status as seller
  const st = await page.request.get(BASE + "/api/account/status");
  out.push({ name: "seller-account-status", status: st.status(), body: (await st.text()).slice(0, 300) });

  await ctx.close();
}

fs.writeFileSync(path.join(dir, "round3.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
