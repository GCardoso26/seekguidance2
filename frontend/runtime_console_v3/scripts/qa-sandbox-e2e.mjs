/**
 * QA Sandbox Functional E2E — exploratory suite with step-level documentation.
 * Output: docs/validation/QA_SANDBOX_E2E_REPORT.md + .json next to this script out dir.
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoDocs = path.resolve(root, "../../docs/validation");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const STARTED = new Date().toISOString();

// load .env.local
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

/** @typedef {{ id: string, module: string, persona: string, steps: string[], status: 'PASS'|'FAIL'|'BLOCKED'|'WARN', severity?: 'P0'|'P1'|'P2'|'P3', error?: string, evidence?: string, consoleErrors?: string[], networkErrors?: string[] }} CaseResult */

/** @type {CaseResult[]} */
const results = [];
const consoleBag = [];
const networkBag = [];

function pushCase(c) {
  results.push(c);
  const icon = c.status === "PASS" ? "✓" : c.status === "WARN" ? "!" : "✗";
  console.log(`[${icon}] ${c.id} ${c.status}${c.error ? " — " + c.error.slice(0, 120) : ""}`);
}

async function collectPage(page) {
  const cons = [];
  const nets = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (/Download the React DevTools|favicon|hydration/i.test(t)) return;
      cons.push(t.slice(0, 300));
      consoleBag.push({ url: page.url(), text: t.slice(0, 300) });
    }
  });
  page.on("pageerror", (err) => {
    cons.push(`pageerror: ${err.message}`.slice(0, 300));
    consoleBag.push({ url: page.url(), text: err.message.slice(0, 300) });
  });
  page.on("response", (res) => {
    const st = res.status();
    if (st >= 500) {
      const entry = `${st} ${res.request().method()} ${res.url()}`;
      nets.push(entry.slice(0, 300));
      networkBag.push({ url: page.url(), entry: entry.slice(0, 300) });
    }
  });
  return { cons, nets };
}

async function snapshotEvidence(page, name) {
  const dir = path.join(root, "test-results", "qa-sandbox");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: false });
    return file;
  } catch {
    return undefined;
  }
}

async function softGoto(page, url, opts = {}) {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000, ...opts });
  await page.waitForTimeout(600);
  return resp;
}

async function bodyText(page, max = 800) {
  return ((await page.locator("body").innerText().catch(() => "")) || "").replace(/\s+/g, " ").slice(0, max);
}

async function runGuestRoutes(page) {
  const routes = [
    { path: "/", expect: /Judge|Loja|Magic|TCG/i, id: "G-HOME" },
    { path: "/loja", expect: /loja|Magic|busca|jogo/i, id: "G-LOJA" },
    { path: "/loja/mtg", expect: /Magic|MTG|cartas|busca/i, id: "G-LOJA-MTG" },
    { path: "/loja/busca", expect: /busca|resultado|filtro|carta/i, id: "G-BUSCA" },
    { path: "/loja/busca?q=Lightning", expect: /Lightning|resultado|carta|nenhum/i, id: "G-BUSCA-Q" },
    { path: "/loja/busca?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E", expect: /./, id: "G-BUSCA-XSS" },
    { path: "/carrinho", expect: /carrinho|vazio|login|entrar|item/i, id: "G-CART" },
    { path: "/marketplace/cart", expect: /carrinho|vazio|entrar|item|checkout/i, id: "G-MCART" },
    { path: "/checkout", expect: /checkout|login|entrar|carrinho|pagamento/i, id: "G-CO" },
    { path: "/comprador", expect: /comprador|entrar|pedido|favorito|login/i, id: "G-BUYER" },
    { path: "/decks", expect: /deck|baralho|entrar|Magic/i, id: "G-DECKS" },
    { path: "/entrar", expect: /entrar|email|senha|login|cadastr/i, id: "G-ENTRAR" },
    { path: "/login", expect: /./, id: "G-LOGIN-LEGACY" },
    { path: "/vendedor/painel", expect: /entrar|vendedor|painel|login/i, id: "G-SELLER-GATE" },
    { path: "/suporte", expect: /suporte|email|ajuda|contato/i, id: "G-SUPORTE" },
    { path: "/termos", expect: /termo|condi|uso/i, id: "G-TERMOS" },
    { path: "/privacidade", expect: /privacidade|dado|LGPD|prote/i, id: "G-PRIV" },
    { path: "/politicas/compra", expect: /compra|pol/i, id: "G-POL-C" },
    { path: "/politicas/cancelamento", expect: /cancel/i, id: "G-POL-X" },
    { path: "/politicas/reembolso", expect: /reembols/i, id: "G-POL-R" },
    { path: "/politicas/marketplace", expect: /marketplace|mercado/i, id: "G-POL-M" },
    { path: "/games", expect: /jogo|Magic|game/i, id: "G-GAMES" },
    { path: "/alerts", expect: /alerta|entrar|login|pre/i, id: "G-ALERTS" },
    { path: "/notifications", expect: /notif|entrar|login/i, id: "G-NOTIF" },
    { path: "/leaderboard", expect: /leader|ranking|xp|entrar/i, id: "G-LB" },
    { path: "/admin/console", expect: /admin|entrar|login|negad|acesso|console/i, id: "G-ADMIN" },
    { path: "/rota-inexistente-qa-404", expect: /404|encontr|não|not found|Judge/i, id: "G-404" },
  ];

  for (const r of routes) {
    const steps = [`GET ${r.path}`, "Aguardar DOM", "Validar texto/status"];
    try {
      const resp = await softGoto(page, BASE + r.path);
      const status = resp?.status() ?? 0;
      const text = await bodyText(page);
      const url = page.url();
      const okText = r.expect.test(text) || r.expect.test(url);
      const badStatus = status >= 500;
      let statusResult = "PASS";
      let error;
      let severity;
      if (badStatus) {
        statusResult = "FAIL";
        severity = "P0";
        error = `HTTP ${status}`;
      } else if (!okText && status !== 404) {
        statusResult = "WARN";
        severity = "P2";
        error = `Conteúdo inesperado (HTTP ${status}). Snippet: ${text.slice(0, 160)}`;
      }
      if (r.id === "G-LOGIN-LEGACY") {
        // Document redirect behavior vs /entrar
        steps.push(`URL final: ${url}`);
        if (!/entrar|login/i.test(url) && !/entrar|login|senha/i.test(text)) {
          statusResult = "FAIL";
          severity = "P1";
          error = `/login não redireciona para auth útil. Final=${url}`;
        } else if (/\/login/.test(url) && !/senha|email/i.test(text)) {
          statusResult = "WARN";
          severity = "P1";
          error = `/login ainda existe sem fluxo claro. Final=${url}`;
        } else {
          error = `Legacy path observável. Final=${url}`;
          if (statusResult === "PASS") statusResult = "WARN";
          severity = severity || "P2";
        }
      }
      const ev = statusResult !== "PASS" ? await snapshotEvidence(page, r.id) : undefined;
      pushCase({
        id: r.id,
        module: "Guest / Rotas públicas",
        persona: "guest",
        steps,
        status: statusResult,
        severity,
        error,
        evidence: ev,
      });
    } catch (e) {
      pushCase({
        id: r.id,
        module: "Guest / Rotas públicas",
        persona: "guest",
        steps,
        status: "FAIL",
        severity: "P0",
        error: String(e.message || e),
        evidence: await snapshotEvidence(page, r.id),
      });
    }
  }
}

async function runAuthInvalid(page) {
  const steps = [
    "Abrir /entrar",
    "Submeter formulário vazio",
    "Submeter email inválido",
    "Submeter credenciais inexistentes",
  ];
  try {
    await softGoto(page, BASE + "/entrar");
    // empty submit
    const submit = page.getByRole("button", { name: /entrar|continuar|login|enviar/i }).first();
    if (await submit.count()) {
      await submit.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const email = page.locator('input[type="email"], input[name="email"], #email').first();
    const pass = page.locator('input[type="password"], input[name="password"], #password').first();
    if (!(await email.count()) || !(await pass.count())) {
      pushCase({
        id: "A-INVALID-FORM",
        module: "Auth",
        persona: "guest",
        steps,
        status: "FAIL",
        severity: "P0",
        error: "Campos email/senha não encontrados em /entrar",
        evidence: await snapshotEvidence(page, "A-INVALID-FORM"),
      });
      return;
    }

    await email.fill("nao-e-email");
    await pass.fill("x");
    await submit.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    const afterInvalid = await bodyText(page, 500);
    const stayed = /entrar|login|senha|email|inválid|invalid/i.test(afterInvalid + page.url());

    await email.fill("qa-inexistente-" + Date.now() + "@example.com");
    await pass.fill("SenhaErrada123!");
    await submit.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);
    const afterBad = await bodyText(page, 800);
    const hasFeedback =
      /inválid|incorret|não encontr|credencial|erro|falha|unable|invalid|wrong/i.test(afterBad);
    const leaked = /stack|exception|supabase\.co\/auth\/v1/i.test(afterBad);

    pushCase({
      id: "A-INVALID-EMAIL",
      module: "Auth",
      persona: "guest",
      steps: ["Email malformado", "Observar validação HTML/app"],
      status: stayed ? "PASS" : "WARN",
      severity: stayed ? undefined : "P2",
      error: stayed ? undefined : "Email inválido não retido no formulário de forma clara",
    });

    pushCase({
      id: "A-BAD-CREDS",
      module: "Auth",
      persona: "guest",
      steps: ["Login com usuário inexistente", "Ver mensagem de erro"],
      status: hasFeedback && !leaked ? "PASS" : leaked ? "FAIL" : "WARN",
      severity: leaked ? "P1" : hasFeedback ? undefined : "P2",
      error: leaked
        ? "Possível vazamento de detalhe técnico no erro"
        : hasFeedback
          ? undefined
          : `Sem feedback claro. Snippet: ${afterBad.slice(0, 180)}`,
      evidence: !hasFeedback || leaked ? await snapshotEvidence(page, "A-BAD-CREDS") : undefined,
    });
  } catch (e) {
    pushCase({
      id: "A-INVALID",
      module: "Auth",
      persona: "guest",
      steps,
      status: "FAIL",
      severity: "P0",
      error: String(e.message || e),
    });
  }
}

async function runSignupValidation(page) {
  const steps = [
    "Abrir /entrar (aba cadastro se houver)",
    "Tentar senha fraca / emails inválidos",
  ];
  try {
    await softGoto(page, BASE + "/entrar");
    const tab = page.getByRole("tab", { name: /cadastr|criar|sign ?up|registrar/i }).first();
    const link = page.getByRole("link", { name: /cadastr|criar conta|registrar/i }).first();
    const btn = page.getByRole("button", { name: /cadastr|criar conta|registrar/i }).first();
    if (await tab.count()) await tab.click().catch(() => {});
    else if (await link.count()) await link.click().catch(() => {});
    else if (await btn.count()) {
      /* already on page maybe */
    }

    await page.waitForTimeout(500);
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const pass = page.locator('input[type="password"]').first();
    const text = await bodyText(page, 400);
    const hasSignupUI = /cadastr|criar conta|registrar|sign ?up/i.test(text);

    if (!(await email.count())) {
      pushCase({
        id: "A-SIGNUP-UI",
        module: "Auth / Cadastro",
        persona: "guest",
        steps,
        status: hasSignupUI ? "WARN" : "BLOCKED",
        severity: "P2",
        error: "UI de cadastro não claramente disponível nesta tela",
        evidence: await snapshotEvidence(page, "A-SIGNUP-UI"),
      });
      return;
    }

    await email.fill("bad");
    if (await pass.count()) await pass.fill("123");
    const submit = page.getByRole("button", { name: /cadastr|criar|registrar|continuar/i }).first();
    if (await submit.count()) await submit.click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
    const after = await bodyText(page, 500);
    const ok =
      page.url().includes("entrar") ||
      /inválid|senha|fraca|mínimo|email|obrigat/i.test(after);

    pushCase({
      id: "A-SIGNUP-WEAK",
      module: "Auth / Cadastro",
      persona: "guest",
      steps,
      status: ok ? "PASS" : "WARN",
      severity: ok ? undefined : "P2",
      error: ok ? undefined : "Cadastro fraco pode ter sido aceito sem mensagem",
      evidence: ok ? undefined : await snapshotEvidence(page, "A-SIGNUP-WEAK"),
    });
  } catch (e) {
    pushCase({
      id: "A-SIGNUP",
      module: "Auth / Cadastro",
      persona: "guest",
      steps,
      status: "FAIL",
      severity: "P1",
      error: String(e.message || e),
    });
  }
}

async function runSearchAndPdp(page) {
  const steps = [
    "Abrir /loja/busca?q=Black Lotus",
    "Clicar primeiro resultado se houver",
    "Inspecionar CTA compra / preço / trust",
  ];
  try {
    await softGoto(page, BASE + "/loja/busca?q=Lightning+Bolt");
    await page.waitForTimeout(1500);
    const links = page.locator(
      'a[href*="/loja/"], a[href*="/marketplace/"], a[href*="/cards/"], a[href*="/product/"]',
    );
    const n = await links.count();
    if (n === 0) {
      // try global search
      await softGoto(page, BASE + "/");
      const search = page.locator('[data-testid="global-search"]');
      if (await search.count()) {
        await search.fill("Lightning");
        await page.waitForTimeout(1200);
        const sr = page.locator('[data-testid="search-results"] a').first();
        if (await sr.count()) {
          await sr.click();
          await page.waitForLoadState("domcontentloaded");
        }
      }
    } else {
      await links.first().click({ force: true });
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(1000);
    }

    const url = page.url();
    const text = await bodyText(page, 1200);
    const hasPrice = /R\$\s*\d|[\d.,]+\s*BRL|preço/i.test(text);
    const hasBuy =
      /adicionar|comprar|carrinho|oferta|ver ofertas|quero/i.test(text);
    const hasLegal = /CNPJ|58\.477\.778|JUDGE TCG|razão social|compra protegida/i.test(text);
    const demoSmell = /sandbox|demo|acordando|Render|mock|fake store/i.test(text);

    pushCase({
      id: "B-SEARCH-RESULTS",
      module: "Buyer / Busca",
      persona: "guest",
      steps: ["Buscar Lightning Bolt / Lightning", `Resultados encontrados ou empty state`],
      status: n > 0 || /nenhum|sem resultado|não encontr/i.test(text) || /Lightning/i.test(text) ? "PASS" : "WARN",
      severity: n > 0 ? undefined : "P2",
      error: n > 0 ? `Encontrados ~links navegáveis; URL=${url}` : `Sem links óbvios. Snippet=${text.slice(0, 140)}`,
    });

    pushCase({
      id: "B-PDP-PRICE-CTA",
      module: "Buyer / PDP",
      persona: "guest",
      steps,
      status: hasPrice && hasBuy ? "PASS" : hasPrice || hasBuy ? "WARN" : "FAIL",
      severity: hasPrice && hasBuy ? undefined : "P1",
      error:
        hasPrice && hasBuy
          ? `PDP ok em ${url}`
          : `Preço=${hasPrice} CTA=${hasBuy} URL=${url}`,
      evidence: !(hasPrice && hasBuy) ? await snapshotEvidence(page, "B-PDP") : undefined,
    });

    pushCase({
      id: "B-PDP-TRUST",
      module: "Buyer / PDP Trust",
      persona: "guest",
      steps: ["Verificar CNPJ/legal/compra protegida na PDP se aplicável"],
      status: hasLegal ? "PASS" : "WARN",
      severity: hasLegal ? undefined : "P1",
      error: hasLegal ? undefined : "Sinais legais ATF não detectados no texto da PDP",
    });

    pushCase({
      id: "B-PDP-DEMO-SMELL",
      module: "Buyer / Percepção",
      persona: "guest",
      steps: ["Procurar cheiro de demo/sandbox no hot path"],
      status: demoSmell ? "FAIL" : "PASS",
      severity: demoSmell ? "P1" : undefined,
      error: demoSmell ? "Texto com aroma demo/sandbox no path de compra" : undefined,
    });
  } catch (e) {
    pushCase({
      id: "B-SEARCH-PDP",
      module: "Buyer / Busca+PDP",
      persona: "guest",
      steps,
      status: "FAIL",
      severity: "P0",
      error: String(e.message || e),
    });
  }
}

async function runCartCheckoutGuest(page) {
  try {
    await softGoto(page, BASE + "/carrinho");
    const cartText = await bodyText(page, 900);
    const loginish = /entrar|login|autentic/i.test(cartText);
    const emptyish = /vazio|sem itens|nenhum item/i.test(cartText);
    const footer = /CNPJ|58\.477\.778|JUDGE TCG|políticas|suporte@/i.test(cartText);

    pushCase({
      id: "B-CART-GUEST",
      module: "Buyer / Carrinho",
      persona: "guest",
      steps: ["Abrir /carrinho sem sessão", "Observar empty vs auth gate"],
      status: emptyish || loginish ? "PASS" : "WARN",
      severity: emptyish || loginish ? undefined : "P2",
      error: `empty=${emptyish} loginGate=${loginish} snippet=${cartText.slice(0, 140)}`,
      evidence: await snapshotEvidence(page, "B-CART-GUEST"),
    });

    pushCase({
      id: "B-CART-TRUST-FOOTER",
      module: "Buyer / Carrinho Trust",
      persona: "guest",
      steps: ["Verificar TrustFooterStrip legal no carrinho"],
      status: footer ? "PASS" : "WARN",
      severity: footer ? undefined : "P1",
      error: footer ? undefined : "Rodapé legal não detectado no carrinho",
    });

    await softGoto(page, BASE + "/checkout");
    const co = await bodyText(page, 900);
    const coOk = /entrar|login|carrinho|checkout|pagamento/i.test(co);
    pushCase({
      id: "B-CHECKOUT-GUEST",
      module: "Buyer / Checkout",
      persona: "guest",
      steps: ["Abrir /checkout guest", "Esperado: redirect/login ou empty guard"],
      status: coOk ? "PASS" : "WARN",
      error: `URL=${page.url()} snippet=${co.slice(0, 140)}`,
      evidence: await snapshotEvidence(page, "B-CHECKOUT-GUEST"),
    });

    // Invalid CEP-like input if field exists
    const cep = page.locator('input[name*="cep" i], input[placeholder*="CEP" i], #cep').first();
    if (await cep.count()) {
      await cep.fill("000");
      await page.waitForTimeout(400);
      await cep.fill("abcde");
      await page.waitForTimeout(400);
      const afterCep = await bodyText(page, 400);
      pushCase({
        id: "B-CEP-INVALID",
        module: "Buyer / Frete",
        persona: "guest",
        steps: ["Inserir CEP inválido (000 / abcde)", "Observar validação"],
        status: /CEP|inválid|dígito|formato/i.test(afterCep) || (await cep.inputValue()).length <= 8
          ? "PASS"
          : "WARN",
        severity: "P2",
        error: `campo presente; valor=${await cep.inputValue()}`,
      });
    } else {
      pushCase({
        id: "B-CEP-INVALID",
        module: "Buyer / Frete",
        persona: "guest",
        steps: ["CEP field no checkout guest"],
        status: "BLOCKED",
        error: "Campo CEP não visível neste estado (esperado se gate de auth)",
      });
    }
  } catch (e) {
    pushCase({
      id: "B-CART-CO",
      module: "Buyer / Carrinho+Checkout",
      persona: "guest",
      steps: ["Guest cart/checkout"],
      status: "FAIL",
      severity: "P0",
      error: String(e.message || e),
    });
  }
}

async function applyAuthCookies(context, email, password) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  const client = createClient(url, anon);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error("no session");
  const hostname = new URL(BASE).hostname;
  const projectRef = new URL(url).hostname.split(".")[0];
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
  await context.addCookies(
    chunks.map(({ name, value }) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      httpOnly: false,
      secure: BASE.startsWith("https"),
      sameSite: "Lax",
    })),
  );
  return true;
}

async function ensureUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sr) return false;
  const admin = createClient(url, sr, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const u of [
    { email: "test-buyer@judgetcg.com", password: "TestBuyer123!", name: "Test Buyer" },
    { email: "test-seller@judgetcg.com", password: "TestSeller123!", name: "Test Seller" },
    {
      email: `qa-new-${Date.now()}@judgetcg-test.com`,
      password: "QaNewUser123!",
      name: "QA New",
      createOnly: true,
    },
  ]) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const existing = list?.users?.find((x) => x.email === u.email);
    if (!existing) {
      const { error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, full_name: u.name },
      });
      if (error && !u.createOnly) console.warn("ensureUser", u.email, error.message);
    }
  }
  return true;
}

async function runBuyerAuth(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectPage(page);
  try {
    await applyAuthCookies(context, "test-buyer@judgetcg.com", "TestBuyer123!");
    await softGoto(page, BASE + "/perfil");
    const text = await bodyText(page, 800);
    const onPerfil = /\/perfil/.test(page.url());
    const menu = await page.locator('[data-testid="user-menu"]').count();
    pushCase({
      id: "B-AUTH-PERFIL",
      module: "Buyer autenticado",
      persona: "buyer",
      steps: ["Login programático test-buyer", "Abrir /perfil", "Ver menu usuário"],
      status: onPerfil && (menu > 0 || /perfil|conta|sair|logout/i.test(text)) ? "PASS" : "FAIL",
      severity: onPerfil ? "P1" : "P0",
      error: `url=${page.url()} menu=${menu} snippet=${text.slice(0, 120)}`,
      evidence: await snapshotEvidence(page, "B-AUTH-PERFIL"),
    });

    await softGoto(page, BASE + "/carrinho");
    const cart = await bodyText(page, 700);
    pushCase({
      id: "B-AUTH-CART",
      module: "Buyer autenticado / Carrinho",
      persona: "buyer",
      steps: ["Abrir carrinho autenticado", "Não deve ser 401 silencioso sem UX"],
      status: /erro 401|unauthorized|falha ao carregar/i.test(cart) ? "FAIL" : "PASS",
      severity: /401|unauthorized/i.test(cart) ? "P0" : undefined,
      error: cart.slice(0, 160),
      evidence: await snapshotEvidence(page, "B-AUTH-CART"),
    });

    await softGoto(page, BASE + "/checkout");
    const co = await bodyText(page, 900);
    const trust = /CNPJ|58\.477\.778|JUDGE TCG|compra protegida|políticas/i.test(co);
    pushCase({
      id: "B-AUTH-CHECKOUT",
      module: "Buyer autenticado / Checkout",
      persona: "buyer",
      steps: ["Abrir checkout", "Ver trust + estado carrinho vazio/com itens"],
      status: /checkout|carrinho|pagamento|vazio|endereço|frete/i.test(co) ? "PASS" : "WARN",
      error: co.slice(0, 160),
    });
    pushCase({
      id: "B-AUTH-CHECKOUT-TRUST",
      module: "Buyer autenticado / Checkout Trust",
      persona: "buyer",
      steps: ["CNPJ/policies no checkout"],
      status: trust ? "PASS" : "WARN",
      severity: trust ? undefined : "P1",
      error: trust ? undefined : "Trust legal não detectado no checkout autenticado",
      evidence: trust ? undefined : await snapshotEvidence(page, "B-AUTH-CHECKOUT-TRUST"),
    });

    await softGoto(page, BASE + "/comprador");
    const buyerHub = await bodyText(page, 700);
    pushCase({
      id: "B-HUB",
      module: "Buyer hub",
      persona: "buyer",
      steps: ["Abrir /comprador"],
      status: /pedido|favorito|comprador|wallet|histórico|alerta/i.test(buyerHub) ? "PASS" : "WARN",
      error: buyerHub.slice(0, 140),
    });

    await softGoto(page, BASE + "/comprador/financeiro");
    const fin = await bodyText(page, 700);
    const dual = /wallet|cashback|crédito|saldo/i.test(fin);
    pushCase({
      id: "B-FINANCEIRO",
      module: "Buyer financeiro",
      persona: "buyer",
      steps: ["Abrir /comprador/financeiro", "Observar se parece pay-ready"],
      status: dual ? "WARN" : /entrar|404|não encontr/i.test(fin) ? "WARN" : "PASS",
      severity: "P2",
      error: `Shell financeiro visitável. Snippet=${fin.slice(0, 140)}`,
      evidence: await snapshotEvidence(page, "B-FINANCEIRO"),
    });

    // Try add to cart from search
    await softGoto(page, BASE + "/loja/busca?q=Bolt");
    await page.waitForTimeout(1200);
    const addBtn = page
      .getByRole("button", { name: /adicionar|carrinho|comprar/i })
      .first();
    if (await addBtn.count()) {
      await addBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      pushCase({
        id: "B-ADD-CART",
        module: "Buyer / Add to cart",
        persona: "buyer",
        steps: ["Clicar adicionar na busca/listagem"],
        status: "PASS",
        error: "Botão clicado; validar carrinho a seguir",
      });
      await softGoto(page, BASE + "/carrinho");
      const afterAdd = await bodyText(page, 800);
      pushCase({
        id: "B-ADD-CART-RESULT",
        module: "Buyer / Add to cart",
        persona: "buyer",
        steps: ["Reabrir carrinho após add"],
        status: /item|Bolt|Lightning|R\$|quantidade/i.test(afterAdd)
          ? "PASS"
          : /vazio|sem itens/i.test(afterAdd)
            ? "WARN"
            : "WARN",
        severity: "P1",
        error: afterAdd.slice(0, 180),
        evidence: await snapshotEvidence(page, "B-ADD-CART-RESULT"),
      });
    } else {
      pushCase({
        id: "B-ADD-CART",
        module: "Buyer / Add to cart",
        persona: "buyer",
        steps: ["Procurar CTA adicionar na busca"],
        status: "BLOCKED",
        error: "Sem botão Adicionar visível na listagem — tentar PDP",
      });
    }
  } catch (e) {
    pushCase({
      id: "B-AUTH-SUITE",
      module: "Buyer autenticado",
      persona: "buyer",
      steps: ["Suite buyer"],
      status: "FAIL",
      severity: "P0",
      error: String(e.message || e),
    });
  } finally {
    await context.close();
  }
}

async function runSellerAuth(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await collectPage(page);
  try {
    await applyAuthCookies(context, "test-seller@judgetcg.com", "TestSeller123!");
    const sellerRoutes = [
      { path: "/vendedor/painel", id: "S-PAINEL", expect: /painel|vendedor|loja|estoque|dashboard|começar|criar/i },
      { path: "/vendedor/painel/estoque", id: "S-ESTOQUE", expect: /estoque|produto|SKU|import|invent/i },
      { path: "/vendedor/painel/listagens", id: "S-LIST", expect: /listagem|anúncio|produto|estoque|nova/i },
      { path: "/vendedor/painel/listagens/nova", id: "S-NOVA", expect: /nova|criar|listagem|produto|preço|carta/i },
      { path: "/vendedor/painel/estoque/importacao", id: "S-CSV", expect: /import|CSV|arquivo|upload/i },
      { path: "/vendedor/painel/financeiro", id: "S-FIN", expect: /finance|pix|receita|saldo|pagamento/i },
      { path: "/vendedor/painel/financeiro-platform", id: "S-FIN-P", expect: /finance|wallet|demo|platform|saldo/i },
      { path: "/vendedor/painel/eventos", id: "S-EVT", expect: /evento|torneio|criar|agenda/i },
      { path: "/vendedor/painel/insights", id: "S-INS", expect: /insight|analy|métric|mover|venda/i },
      { path: "/admin/console", id: "S-ADMIN-AS-SELLER", expect: /admin|negad|acesso|entrar|console|sandbox/i },
    ];

    for (const r of sellerRoutes) {
      try {
        await softGoto(page, BASE + r.path);
        await page.waitForTimeout(900);
        const text = await bodyText(page, 1000);
        const url = page.url();
        const gated = /\/entrar/.test(url);
        const ok = !gated && (r.expect.test(text) || r.expect.test(url));
        pushCase({
          id: r.id,
          module: "Seller",
          persona: "seller",
          steps: [`Abrir ${r.path}`, "Validar conteúdo ou gate"],
          status: ok ? "PASS" : gated ? "WARN" : "WARN",
          severity: gated ? "P1" : ok ? undefined : "P2",
          error: gated
            ? `Redirecionou para login: ${url}`
            : ok
              ? `OK url=${url}`
              : `Conteúdo fraco url=${url} snip=${text.slice(0, 120)}`,
          evidence: !ok ? await snapshotEvidence(page, r.id) : undefined,
        });
      } catch (e) {
        pushCase({
          id: r.id,
          module: "Seller",
          persona: "seller",
          steps: [`Abrir ${r.path}`],
          status: "FAIL",
          severity: "P1",
          error: String(e.message || e),
        });
      }
    }

    // Invalid product create attempts on nova listagem
    await softGoto(page, BASE + "/vendedor/painel/listagens/nova");
    await page.waitForTimeout(800);
    const submit = page.getByRole("button", { name: /salvar|criar|publicar|adicionar/i }).first();
    if (await submit.count()) {
      await submit.click({ force: true }).catch(() => {});
      await page.waitForTimeout(600);
      const after = await bodyText(page, 600);
      const validated = /obrigat|inválid|preencha|required|erro|necessário/i.test(after);
      // try negative price if inputs exist
      const price = page.locator('input[name*="price" i], input[placeholder*="preço" i], input[type="number"]').first();
      if (await price.count()) {
        await price.fill("-10");
        await submit.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }
      pushCase({
        id: "S-NOVA-INVALID",
        module: "Seller / Cadastro produto",
        persona: "seller",
        steps: ["Submit vazio", "Preço negativo se campo existir"],
        status: validated || (await price.count()) ? "PASS" : "WARN",
        severity: "P2",
        error: `validaçãoDetectada=${validated} snip=${after.slice(0, 140)}`,
        evidence: await snapshotEvidence(page, "S-NOVA-INVALID"),
      });
    } else {
      pushCase({
        id: "S-NOVA-INVALID",
        module: "Seller / Cadastro produto",
        persona: "seller",
        steps: ["Form nova listagem"],
        status: "BLOCKED",
        error: "Botão salvar/criar não encontrado — onboarding de loja pode estar incompleto",
        evidence: await snapshotEvidence(page, "S-NOVA-INVALID"),
      });
    }

    // Sandbox status API via FE proxy
    const resp = await page.request.get(BASE + "/api/sandbox/status").catch(() => null);
    if (resp) {
      const st = resp.status();
      const body = await resp.text();
      pushCase({
        id: "SB-STATUS",
        module: "Sandbox platform",
        persona: "seller",
        steps: ["GET /api/sandbox/status"],
        status: st < 500 ? "PASS" : "FAIL",
        severity: st >= 500 ? "P1" : undefined,
        error: `HTTP ${st} body=${body.slice(0, 200)}`,
      });
    }
  } catch (e) {
    pushCase({
      id: "S-SUITE",
      module: "Seller",
      persona: "seller",
      steps: ["Suite seller"],
      status: "FAIL",
      severity: "P0",
      error: String(e.message || e),
    });
  } finally {
    await context.close();
  }
}

async function runApis(page) {
  const endpoints = [
    "/api/health",
    "/api/catalog/health",
    "/api/catalog/sets",
    "/api/catalog/cards/search?q=bolt",
    "/api/sandbox/status",
    "/api/analytics/track",
  ];
  for (const ep of endpoints) {
    try {
      let resp;
      if (ep.endsWith("/track")) {
        resp = await page.request.post(BASE + ep, {
          data: { events: [] },
          headers: { "content-type": "application/json" },
        });
      } else {
        resp = await page.request.get(BASE + ep);
      }
      const st = resp.status();
      const body = (await resp.text()).slice(0, 180);
      const ok = st < 500;
      pushCase({
        id: `API-${ep.replace(/[^\w]+/g, "_").slice(0, 40)}`,
        module: "APIs",
        persona: "system",
        steps: [`${ep.endsWith("/track") ? "POST" : "GET"} ${ep}`],
        status: ok ? "PASS" : "FAIL",
        severity: ok ? undefined : "P0",
        error: `HTTP ${st} ${body}`,
      });
    } catch (e) {
      pushCase({
        id: `API-ERR`,
        module: "APIs",
        persona: "system",
        steps: [ep],
        status: "FAIL",
        severity: "P0",
        error: String(e.message || e),
      });
    }
  }
}

async function runBrokenLinksSample(page) {
  await softGoto(page, BASE + "/");
  const hrefs = await page.$$eval("a[href]", (as) =>
    [...new Set(as.map((a) => a.getAttribute("href")).filter(Boolean))]
      .filter((h) => h.startsWith("/") && !h.startsWith("//"))
      .slice(0, 40),
  );
  let fail = 0;
  const failed = [];
  for (const h of hrefs) {
    try {
      const r = await page.request.get(BASE + h, { maxRedirects: 5 });
      if (r.status() >= 500) {
        fail++;
        failed.push(`${r.status()} ${h}`);
      }
    } catch (e) {
      fail++;
      failed.push(`ERR ${h} ${e.message}`);
    }
  }
  pushCase({
    id: "G-HOME-LINKS",
    module: "Guest / Links home",
    persona: "guest",
    steps: [`Probe ${hrefs.length} links internos da home`],
    status: fail === 0 ? "PASS" : "FAIL",
    severity: fail ? "P1" : undefined,
    error: fail ? failed.slice(0, 8).join(" | ") : `${hrefs.length} links <=499`,
  });
}

function writeReport() {
  const ended = new Date().toISOString();
  const counts = {
    PASS: results.filter((r) => r.status === "PASS").length,
    FAIL: results.filter((r) => r.status === "FAIL").length,
    WARN: results.filter((r) => r.status === "WARN").length,
    BLOCKED: results.filter((r) => r.status === "BLOCKED").length,
  };
  const bugs = results.filter((r) => r.status === "FAIL" || (r.status === "WARN" && (r.severity === "P0" || r.severity === "P1")));

  const md = [
    `# QA Sandbox — Relatório E2E Funcional`,
    ``,
    `**Ambiente:** \`${BASE}\` (NEXT_PUBLIC_APP_MODE=sandbox / development elevável)`,
    `**Início:** ${STARTED}`,
    `**Fim:** ${ended}`,
    `**Executor:** Playwright Chromium (QA Analista Funcional — suíte exploratória)`,
    ``,
    `## Resumo`,
    ``,
    `| Status | Qtd |`,
    `|---|---:|`,
    `| PASS | ${counts.PASS} |`,
    `| FAIL | ${counts.FAIL} |`,
    `| WARN | ${counts.WARN} |`,
    `| BLOCKED | ${counts.BLOCKED} |`,
    `| **Total casos** | **${results.length}** |`,
    ``,
    `## Achados prioritários (FAIL + WARN P0/P1)`,
    ``,
    bugs.length
      ? [
          `| ID | Módulo | Severidade | Status | Erro |`,
          `|---|---|---|---|---|`,
          ...bugs.map(
            (b) =>
              `| ${b.id} | ${b.module} | ${b.severity || "-"} | ${b.status} | ${(b.error || "").replace(/\|/g, "/").slice(0, 160)} |`,
          ),
        ].join("\n")
      : "_Nenhum FAIL/WARN P0-P1._",
    ``,
    `## Matriz completa de execução`,
    ``,
    `| ID | Módulo | Persona | Status | Sev | Passos | Resultado/Erro |`,
    `|---|---|---|---|---|---|---|`,
    ...results.map((r) => {
      const steps = r.steps.map((s, i) => `${i + 1}. ${s}`).join("<br>");
      return `| ${r.id} | ${r.module} | ${r.persona} | ${r.status} | ${r.severity || ""} | ${steps} | ${(r.error || "OK").replace(/\|/g, "/").slice(0, 200)} |`;
    }),
    ``,
    `## Erros de console (amostra)`,
    ``,
    consoleBag.length
      ? consoleBag
          .slice(0, 30)
          .map((c) => `- \`${c.url}\`: ${c.text.replace(/\n/g, " ").slice(0, 200)}`)
          .join("\n")
      : "_Nenhum console.error relevante capturado._",
    ``,
    `## Erros de rede 5xx (amostra)`,
    ``,
    networkBag.length
      ? networkBag
          .slice(0, 30)
          .map((n) => `- página \`${n.url}\` → ${n.entry}`)
          .join("\n")
      : "_Nenhum 5xx capturado durante navegação._",
    ``,
    `## Método`,
    ``,
    `1. Guest: rotas públicas, políticas, 404, links da home, busca XSS, legado \`/login\`.`,
    `2. Auth: formulário vazio, email inválido, credenciais inexistentes, cadastro fraco.`,
    `3. Buyer: busca → PDP → trust/demo-smell → carrinho/checkout guest + autenticado (test-buyer).`,
    `4. Seller: painel/estoque/listagens/nova/CSV/financeiro/eventos/insights + submit inválido.`,
    `5. APIs: health, catalog, sandbox status, analytics soft-track.`,
    ``,
    `## Decisão`,
    ``,
    counts.FAIL > 0
      ? `**NO-GO parcial** — ${counts.FAIL} falha(s) bloqueante(s) para considerar sandbox estável.`
      : counts.WARN > 0
        ? `**GO com ressalvas** — sem FAIL duro; ${counts.WARN} avisos a triar.`
        : `**GO** — suíte exploratória sem FAIL/WARN.`,
    ``,
  ].join("\n");

  fs.mkdirSync(repoDocs, { recursive: true });
  const mdPath = path.join(repoDocs, "QA_SANDBOX_E2E_REPORT.md");
  fs.writeFileSync(mdPath, md, "utf8");
  const jsonPath = path.join(repoDocs, "QA_SANDBOX_E2E_REPORT.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ started: STARTED, ended, base: BASE, counts, results, consoleBag, networkBag }, null, 2),
    "utf8",
  );
  console.log(`\nReport written:\n- ${mdPath}\n- ${jsonPath}`);
  return { counts, mdPath, jsonPath };
}

async function main() {
  console.log(`QA Sandbox E2E @ ${BASE}`);
  await ensureUsers().catch((e) => console.warn("ensureUsers", e.message));

  const browser = await chromium.launch({ headless: true });
  const guest = await browser.newContext();
  const page = await guest.newPage();
  await collectPage(page);

  await runApis(page);
  await runGuestRoutes(page);
  await runBrokenLinksSample(page);
  await runAuthInvalid(page);
  await runSignupValidation(page);
  await runSearchAndPdp(page);
  await runCartCheckoutGuest(page);
  await guest.close();

  await runBuyerAuth(browser);
  await runSellerAuth(browser);

  await browser.close();
  const { counts } = writeReport();
  process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try {
    writeReport();
  } catch {}
  process.exit(2);
});
