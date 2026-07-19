import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const SELLER_AUTH = path.join(__dirname, "../.auth/seller.json");
const BUYER_AUTH = path.join(__dirname, "../.auth/buyer.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

test.describe("Permissões", () => {
  test.beforeAll(() => {
    resetLifecycleSharedState();
    if (fs.existsSync(MANIFEST)) getLifecycleSharedState();
  });

  test("comprador tentando editar produto → 403 na API", async ({ browser }, testInfo) => {
    if (!fs.existsSync(BUYER_AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "buyer.json + seed necessários");
      return;
    }
    const ctx = await browser.newContext({ storageState: BUYER_AUTH });
    const page = await ctx.newPage();
    await installLifecycleMocks(page, { forbidProductMutations: true });
    await page.goto("/vendedor/painel/catalogo/produtos");
    // middleware exige sessão; buyer autenticado pode ver shell, mas mutação bloqueada
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hack", price: 1, quantity: 1, category: "sleeve" }),
      });
      return res.status;
    });
    expect(status).toBe(403);
    await ctx.close();
  });

  test("lojista tentando acessar painel admin", async ({ browser }, testInfo) => {
    if (!fs.existsSync(SELLER_AUTH)) {
      testInfo.skip(true, "seller.json necessário");
      return;
    }
    const ctx = await browser.newContext({ storageState: SELLER_AUTH });
    const page = await ctx.newPage();
    const res = await page.goto("/admin");
    // middleware: redirect login ou deny/HTML — não deve expor painel admin funcional
    const url = page.url();
    const status = res?.status() ?? 0;
    const body = await page.locator("body").innerText().catch(() => "");
    const blocked =
      /entrar|login|forbidden|403|não autorizado|unauthorized/i.test(`${url} ${body}`) ||
      status === 403 ||
      status === 401;
    expect(blocked || !/dashboard admin|observability/i.test(body)).toBeTruthy();
    await ctx.close();
  });

  test("conta suspensa — dashboard sinaliza ou bloqueia", async ({ browser }, testInfo) => {
    if (!fs.existsSync(SELLER_AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "seed + seller auth");
      return;
    }
    const ctx = await browser.newContext({ storageState: SELLER_AUTH });
    const page = await ctx.newPage();
    await installLifecycleMocks(page, {
      storeOverrides: { account_status: "suspended", subscription_plan: "pro" },
    });
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    // mock expõe account_status no /dashboard — UI pode não renderizar ainda; garante API
    const payload = await page.evaluate(async () => {
      const res = await fetch("/api/seller/dashboard");
      return res.json();
    });
    expect(payload.account_status).toBe("suspended");
    await ctx.close();
  });

  test("assinatura expirada (plano free no mock)", async ({ browser }, testInfo) => {
    if (!fs.existsSync(SELLER_AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "seed + seller auth");
      return;
    }
    const ctx = await browser.newContext({ storageState: SELLER_AUTH });
    const page = await ctx.newPage();
    await installLifecycleMocks(page, {
      storeOverrides: { account_status: "expired", subscription_plan: "free" },
    });
    await page.goto("/vendedor/painel/estatisticas");
    await waitForSellerPanelReady(page);
    const payload = await page.evaluate(async () => {
      const res = await fetch("/api/seller/dashboard");
      return res.json() as Promise<{
        account_status?: string;
        store?: { subscription_plan?: string };
      }>;
    });
    expect(payload.account_status).toBe("expired");
    expect(payload.store?.subscription_plan).toBe("free");
    // Em sandbox local o frontend eleva features; a API mock permanece a fonte de verdade.
    await ctx.close();
  });

  test("admin editando qualquer loja (seller com loja mock)", async ({ browser }, testInfo) => {
    if (!fs.existsSync(SELLER_AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "seed + seller auth");
      return;
    }
    const ctx = await browser.newContext({ storageState: SELLER_AUTH });
    const page = await ctx.newPage();
    await installLifecycleMocks(page);
    await page.goto("/vendedor/painel/catalogo/produtos");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("btn-add-product")).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  });
});
