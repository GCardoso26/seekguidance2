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

const cases = [];

function log(c) {
  cases.push(c);
  console.log(`[${c.status}] ${c.id} — ${(c.error || "ok").slice(0, 140)}`);
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

async function dump(page, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  return ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 1200);
}

const browser = await chromium.launch({ headless: true });

// --- Auth UI: valid/invalid/register weak ---
{
  const page = await browser.newPage();
  await page.goto(BASE + "/entrar", { waitUntil: "networkidle" }).catch(() =>
    page.goto(BASE + "/entrar", { waitUntil: "domcontentloaded" }),
  );
  await page.waitForSelector("input[type=email]", { timeout: 15000 });

  // empty HTML5 validation
  await page.getByRole("button", { name: /entrar com e-mail/i }).click();
  const emptyValid = await page.locator("input[type=email]").evaluate((el) => el.validationMessage);
  log({
    id: "A2-EMPTY",
    module: "Auth",
    steps: ["Submit vazio", "Checar validationMessage nativo"],
    status: emptyValid ? "PASS" : "WARN",
    error: `validationMessage=${emptyValid || "(vazio)"}`,
  });

  // invalid email format
  await page.fill("input[type=email]", "x@");
  await page.fill("input[type=password]", "short");
  await page.getByRole("button", { name: /entrar com e-mail/i }).click();
  const invMsg = await page.locator("input[type=email]").evaluate((el) => el.validationMessage);
  log({
    id: "A2-BAD-EMAIL",
    module: "Auth",
    steps: ["Email x@", "Senha short"],
    status: invMsg || (await page.locator('[role=alert]').count()) ? "PASS" : "WARN",
    error: `emailValidation=${invMsg}`,
  });

  // bad creds
  await page.fill("input[type=email]", "nobody-qa@example.com");
  await page.fill("input[type=password]", "WrongPass999!");
  await page.getByRole("button", { name: /entrar com e-mail/i }).click();
  await page.waitForTimeout(2500);
  const badText = await dump(page, "a2-bad-creds");
  const enLeak = /Invalid login credentials/i.test(badText);
  const ptMsg = /inválid|incorret|credencial/i.test(badText);
  log({
    id: "A2-BAD-CREDS",
    module: "Auth",
    steps: ["Credenciais inexistentes", "Avaliar mensagem"],
    status: enLeak ? "WARN" : ptMsg ? "PASS" : "FAIL",
    severity: "P2",
    error: enLeak
      ? "Mensagem de erro em inglês (Invalid login credentials) — UX inconsistente"
      : badText.slice(0, 160),
  });

  // weak register password (<8)
  await page.getByRole("button", { name: /registre/i }).click();
  await page.waitForTimeout(400);
  await page.fill("input[type=email]", `qa-weak-${Date.now()}@example.com`);
  await page.fill("input[type=password]", "1234567");
  await page.getByRole("button", { name: /criar conta/i }).click();
  const weakVal = await page.locator("input[type=password]").evaluate((el) => el.validationMessage);
  log({
    id: "A2-WEAK-PASS",
    module: "Auth/Cadastro",
    steps: ["Modo registro", "Senha 7 chars < minLength 8"],
    status: weakVal ? "PASS" : "WARN",
    error: `passwordValidation=${weakVal || "sem validationMessage"}`,
  });

  // valid-looking register (may succeed or need confirm)
  const newEmail = `qa-e2e-${Date.now()}@judgetcg-test.com`;
  await page.fill("input[type=email]", newEmail);
  await page.fill("input[type=password]", "QaStrongPass123!");
  await page.getByRole("button", { name: /criar conta/i }).click();
  await page.waitForTimeout(3500);
  const regText = await dump(page, "a2-register");
  log({
    id: "A2-REGISTER",
    module: "Auth/Cadastro",
    steps: [`Criar conta ${newEmail}`, "Observar confirm/redirect"],
    status: /confirmação|confirm|perfil|completar|sucesso|já cadastrad/i.test(regText) ||
      !page.url().includes("/entrar")
      ? "PASS"
      : /erro|fail|invalid/i.test(regText)
        ? "WARN"
        : "WARN",
    error: `url=${page.url()} snip=${regText.slice(0, 200)}`,
  });
  await page.close();
}

// --- Buyer completar-perfil + account status ---
{
  const ctx = await authContext(browser, "test-buyer@judgetcg.com", "TestBuyer123!");
  const page = await ctx.newPage();
  const st = await page.request.get(BASE + "/api/account/status");
  log({
    id: "B2-ACCOUNT-STATUS",
    module: "Buyer/Account",
    steps: ["GET /api/account/status autenticado"],
    status: st.status() < 500 ? "PASS" : "FAIL",
    severity: st.status() >= 500 ? "P0" : undefined,
    error: `HTTP ${st.status()} ${(await st.text()).slice(0, 250)}`,
  });

  await page.goto(BASE + "/completar-perfil", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const cp = await dump(page, "b2-completar-perfil");
  const stuckLoading = /Carregando…|Carregando\.\.\./i.test(cp) && !(await page.locator("input").count());
  log({
    id: "B2-COMPLETAR-PERFIL",
    module: "Buyer/KYC",
    steps: ["Abrir /completar-perfil", "Aguardar 5s", "Ver formulário CPF"],
    status: stuckLoading ? "FAIL" : /cpf|documento|completar/i.test(cp) ? "PASS" : "WARN",
    severity: stuckLoading ? "P1" : "P2",
    error: stuckLoading
      ? "Tela fica em Carregando… sem inputs (possível hang de account status)"
      : cp.slice(0, 220),
  });

  // try fill CPF invalid if exists
  const cpf = page.locator('input[name*="cpf" i], input[placeholder*="CPF" i], input[inputmode="numeric"]').first();
  if (await cpf.count()) {
    await cpf.fill("11111111111");
    const submit = page.getByRole("button", { name: /salvar|continuar|enviar|validar/i }).first();
    if (await submit.count()) await submit.click().catch(() => {});
    await page.waitForTimeout(1000);
    const after = await dump(page, "b2-cpf-invalid");
    log({
      id: "B2-CPF-INVALID",
      module: "Buyer/KYC",
      steps: ["CPF 11111111111", "Submit"],
      status: /inválid|incorret|digito|cpf/i.test(after) ? "PASS" : "WARN",
      error: after.slice(0, 180),
    });
  } else {
    log({
      id: "B2-CPF-INVALID",
      module: "Buyer/KYC",
      steps: ["Campo CPF"],
      status: "BLOCKED",
      error: "Campo CPF não renderizado",
    });
  }
  await ctx.close();
}

// --- Seller store cadastro ---
{
  const ctx = await authContext(browser, "test-seller@judgetcg.com", "TestSeller123!");
  const page = await ctx.newPage();

  await page.goto(BASE + "/vendedor/painel", { waitUntil: "domcontentloaded" });
  // wait up to 20s for painel
  let painelText = "";
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(2000);
    painelText = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ");
    if (!/^Carregando painel/i.test(painelText.trim()) && !painelText.includes("Carregando painel…")) break;
  }
  await page.screenshot({ path: path.join(dir, "s2-painel.png") });
  const stillLoading = /Carregando painel/i.test(painelText);
  log({
    id: "S2-PAINEL-LOAD",
    module: "Seller/Painel",
    steps: ["Abrir /vendedor/painel", "Aguardar até 20s"],
    status: stillLoading ? "FAIL" : "PASS",
    severity: stillLoading ? "P1" : undefined,
    error: stillLoading
      ? "Painel permanece em 'Carregando painel…' (>20s)"
      : painelText.slice(0, 220),
  });

  // Find cadastrar loja
  await page.goto(BASE + "/vendedor/painel/estoque", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const est = await dump(page, "s2-estoque");
  const cadastrar = page.getByRole("link", { name: /cadastrar loja/i }).or(page.getByRole("button", { name: /cadastrar loja/i }));
  if (await cadastrar.count()) {
    await cadastrar.first().click();
    await page.waitForTimeout(2000);
    const url = page.url();
    const formText = await dump(page, "s2-cadastro-loja");
    log({
      id: "S2-CADASTRO-ENTRY",
      module: "Seller/Loja",
      steps: ["Clicar Cadastrar loja"],
      status: /loja|store|nome|slug|criar/i.test(formText) ? "PASS" : "WARN",
      error: `url=${url} snip=${formText.slice(0, 200)}`,
    });

    // invalid submit
    const submit = page.getByRole("button", { name: /criar|salvar|cadastrar|continuar/i }).first();
    if (await submit.count()) {
      await submit.click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      const afterEmpty = await dump(page, "s2-loja-empty");
      log({
        id: "S2-LOJA-EMPTY",
        module: "Seller/Loja",
        steps: ["Submit cadastro vazio"],
        status: /obrigat|preencha|inválid|required|necessário/i.test(afterEmpty) || page.url() === url
          ? "PASS"
          : "WARN",
        error: afterEmpty.slice(0, 180),
      });

      // fill invalid slug/name
      const inputs = page.locator("input:visible");
      const n = await inputs.count();
      for (let i = 0; i < Math.min(n, 6); i++) {
        const t = await inputs.nth(i).getAttribute("type");
        if (t === "email") await inputs.nth(i).fill("bad");
        else if (t === "url") await inputs.nth(i).fill("not-a-url");
        else await inputs.nth(i).fill(i === 0 ? "!!" : "x");
      }
      if (await submit.count()) await submit.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      const afterBad = await dump(page, "s2-loja-invalid");
      log({
        id: "S2-LOJA-INVALID",
        module: "Seller/Loja",
        steps: ["Preencher dados inválidos (!! / x)", "Submit"],
        status: /inválid|slug|nome|erro|caracter/i.test(afterBad) || /cadastr|criar/i.test(page.url())
          ? "PASS"
          : "WARN",
        error: afterBad.slice(0, 200),
      });

      // valid-ish create attempt
      for (let i = 0; i < Math.min(n, 6); i++) {
        const ph = ((await inputs.nth(i).getAttribute("placeholder")) || "").toLowerCase();
        const name = ((await inputs.nth(i).getAttribute("name")) || "").toLowerCase();
        const key = ph + name;
        if (/slug/.test(key)) await inputs.nth(i).fill(`qa-loja-${Date.now().toString().slice(-6)}`);
        else if (/nome|name|store|loja/.test(key)) await inputs.nth(i).fill(`QA Loja ${Date.now().toString().slice(-4)}`);
        else if (/email/.test(key)) await inputs.nth(i).fill("seller-qa@judgetcg-test.com");
        else if (/cnpj/.test(key)) await inputs.nth(i).fill("58477778000176");
        else if (/desc/.test(key)) await inputs.nth(i).fill("Loja de teste QA sandbox");
        else await inputs.nth(i).fill(`Valor QA ${i}`);
      }
      // textareas
      const areas = page.locator("textarea:visible");
      const an = await areas.count();
      for (let i = 0; i < an; i++) await areas.nth(i).fill("Descrição QA sandbox E2E");
      await submit.click({ force: true }).catch(() => {});
      await page.waitForTimeout(3000);
      const afterOk = await dump(page, "s2-loja-valid-attempt");
      log({
        id: "S2-LOJA-CREATE-ATTEMPT",
        module: "Seller/Loja",
        steps: ["Preencher dados plausíveis", "Submit criar loja"],
        status: /sucesso|criad|painel|estoque|bem-vindo/i.test(afterOk) ||
          !/cadastrar loja/i.test(afterOk)
          ? "PASS"
          : "WARN",
        error: `url=${page.url()} snip=${afterOk.slice(0, 220)}`,
      });
    } else {
      log({
        id: "S2-LOJA-EMPTY",
        module: "Seller/Loja",
        steps: ["Form cadastro"],
        status: "BLOCKED",
        error: "Sem botão submit no fluxo de cadastro",
      });
    }
  } else {
    log({
      id: "S2-CADASTRO-ENTRY",
      module: "Seller/Loja",
      steps: ["Localizar Cadastrar loja"],
      status: /já|loja/i.test(est) ? "WARN" : "FAIL",
      error: `CTA não encontrado. snip=${est.slice(0, 200)}`,
    });
  }

  // Demo numbers on seller nav
  await page.goto(BASE + "/vendedor/painel/listagens", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const list = await dump(page, "s2-listagens");
  const fakeBadges = /Pedidos\s*12|Atendimento\s*3/.test(list);
  log({
    id: "S2-DEMO-BADGES",
    module: "Seller/Percepção",
    steps: ["Inspecionar badges Pedidos/Atendimento no nav"],
    status: fakeBadges ? "FAIL" : "PASS",
    severity: fakeBadges ? "P1" : undefined,
    error: fakeBadges
      ? "Badges hardcoded Pedidos 12 / Atendimento 3 sem loja real — cheiro de demo"
      : "Sem badges demo óbvios",
  });

  // Publish flow blocked by catalog
  await page.goto(BASE + "/vendedor/painel/listagens/nova", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const nova = await dump(page, "s2-nova");
  const searchingStuck = /Buscando…|Buscando\.\.\./i.test(nova);
  log({
    id: "S2-NOVA-CATALOG",
    module: "Seller/Listagem",
    steps: ["Abrir nova listagem", "Aguardar catálogo de cartas"],
    status: searchingStuck || /nenhuma|erro|indispon/i.test(nova) ? "FAIL" : "PASS",
    severity: "P0",
    error: searchingStuck
      ? "Catálogo em 'Buscando…' — consistente com API search 429/degraded"
      : nova.slice(0, 200),
  });

  await ctx.close();
}

// --- Guest marketplace listings without search API ---
{
  const page = await browser.newPage();
  for (const p of ["/loja", "/loja/mtg", "/stores", "/marketplace"]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2000);
    const t = ((await page.locator("body").innerText()) || "").replace(/\s+/g, " ").slice(0, 400);
    const hasProducts = await page.locator("a[href*='/marketplace/product'], a[href*='/cards/'], [data-testid*='product'], [data-testid*='listing']").count();
    log({
      id: `G2-${p.replace(/\W+/g, "_").toUpperCase()}`,
      module: "Guest/Browse",
      steps: [`Abrir ${p}`, "Contar listings/cards"],
      status: hasProducts > 0 || /loja|magic|marketplace|produto/i.test(t) ? (hasProducts > 0 ? "PASS" : "WARN") : "WARN",
      error: `products=${hasProducts} url=${page.url()} snip=${t.slice(0, 140)}`,
    });
  }
  // featured on home
  await page.goto(BASE + "/");
  await page.waitForTimeout(3000);
  const homeCards = await page.locator('[data-testid="featured-cards"] a, [data-testid="featured-cards"] [data-testid]').count();
  const homeShops = await page.locator('[data-testid="featured-shops"] a').count();
  log({
    id: "G2-HOME-FEATURED",
    module: "Guest/Home",
    steps: ["Home featured cards/shops"],
    status: homeCards + homeShops > 0 ? "PASS" : "WARN",
    severity: homeCards + homeShops === 0 ? "P1" : undefined,
    error: `featuredCards=${homeCards} featuredShops=${homeShops}`,
  });
  await page.close();
}

// Sandbox badge on public surfaces
{
  const page = await browser.newPage();
  await page.goto(BASE + "/loja");
  await page.waitForTimeout(1000);
  const t = await page.locator("body").innerText();
  log({
    id: "SB-BADGE-PUBLIC",
    module: "Sandbox/Percepção",
    steps: ["Ver badge SANDBOX no header da loja pública"],
    status: /SANDBOX/i.test(t) ? "WARN" : "PASS",
    severity: "P2",
    error: /SANDBOX/i.test(t)
      ? "Badge SANDBOX visível no hot path comprador (esperado em APP_MODE=sandbox; risco se vazar para prod)"
      : "Sem badge",
  });
  await page.close();
}

fs.writeFileSync(path.join(dir, "round2.json"), JSON.stringify(cases, null, 2));
console.log("\nWrote", path.join(dir, "round2.json"), "cases=", cases.length);
await browser.close();
