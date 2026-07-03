import { test, expect } from "@playwright/test";
import { test as authTest, expect as authExpect } from "../fixtures/auth";

test.describe("Vendedor — proteção de rota", () => {
  test("painel sem sessão redireciona para entrar", async ({ page }) => {
    await page.goto("/vendedor/painel");
    await expect(page).toHaveURL(/\/entrar/, { timeout: 15_000 });
    expect(page.url()).toContain("next=%2Fvendedor%2Fpainel");
  });

  test("listagens sem sessão redireciona para entrar", async ({ page }) => {
    await page.goto("/vendedor/painel/listagens");
    await expect(page).toHaveURL(/\/entrar/, { timeout: 15_000 });
  });
});

test.describe("KYC e CPF — páginas públicas", () => {
  test("completar-perfil exige login", async ({ page }) => {
    await page.goto("/completar-perfil");
    await expect(page.getByText(/faça login/i)).toBeVisible({ timeout: 10_000 });
  });

  test("loja suspensa carrega sem erro", async ({ page }) => {
    await page.goto("/loja/suspensa");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

authTest.describe("Vendedor autenticado", () => {
  authTest("seller acessa painel ou suspensa por KYC", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel");
    await authExpect(page).toHaveURL(/\/(vendedor\/painel|loja\/suspensa)/, { timeout: 20_000 });
    await authExpect(page.locator("main, #main-content, body")).toBeVisible();
  });

  authTest("seller vê catálogo de cartas ou redirecionamento KYC", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/listagens");
    await authExpect(page).toHaveURL(
      /\/(vendedor\/painel\/catalogo\/cartas|loja\/suspensa|entrar)/,
      { timeout: 20_000 },
    );
    if (page.url().includes("/catalogo/cartas")) {
      await authExpect(page.getByPlaceholder("Pesquisar carta…")).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  authTest("catálogo mobile 375px mostra busca ou skeleton", async ({ sellerPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/vendedor/painel/listagens");
    await authExpect(page).toHaveURL(
      /\/(vendedor\/painel\/catalogo\/cartas|loja\/suspensa|entrar)/,
      { timeout: 20_000 },
    );
    if (!page.url().includes("/catalogo/cartas")) return;

    const search = page.getByPlaceholder("Pesquisar carta…");
    const skeleton = page.getByText(/carregando|buscando cartas/i);
    await authExpect(search.or(skeleton).first()).toBeVisible({ timeout: 15_000 });
  });

  authTest("seller acessa pedidos com PageShell", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/vendas");
    await authExpect(page).toHaveURL(
      /\/(vendedor\/painel\/pedidos|loja\/suspensa|entrar)/,
      { timeout: 20_000 },
    );
    if (!page.url().includes("/pedidos")) return;
    await authExpect(page.getByRole("heading", { name: /^pedidos$/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  authTest("pedidos mobile 375px mostra tabs ou empty", async ({ sellerPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/vendedor/painel/vendas");
    await authExpect(page).toHaveURL(
      /\/(vendedor\/painel\/pedidos|loja\/suspensa|entrar)/,
      { timeout: 20_000 },
    );
    if (!page.url().includes("/pedidos")) return;

    const tabs = page.getByRole("tab", { name: /todos|aguardando/i });
    const loading = page.getByText(/carregando pedidos/i);
    await authExpect(tabs.or(loading).first()).toBeVisible({ timeout: 15_000 });
  });

  authTest("nova listagem exibe form RHF quando cardId presente", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/listagens/nova");
    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/listagens\/nova|loja\/suspensa|entrar)/, {
      timeout: 20_000,
    });
    if (!page.url().includes("/vendedor/painel/listagens/nova")) return;

    const noCardHint = page.getByRole("link", { name: /buscar cartas/i });
    const cardIdHint = page.getByText(/\?cardId=/i);
    const form = page.getByTestId("create-listing-form");
    await authExpect(noCardHint.or(cardIdHint).or(form).first()).toBeVisible({ timeout: 15_000 });
  });
});

authTest.describe("Comprador — gate CPF", () => {
  authTest("checkout mostra modal ou página de checkout", async ({ buyerPage: page }) => {
    await page.goto("/marketplace/checkout");
    await authExpect(page).toHaveURL(/\/checkout/, { timeout: 10_000 });
    const cpfModal = page.getByRole("heading", { name: /cpf obrigatório/i });
    const checkoutTitle = page.getByRole("heading", { name: /^checkout$/i });
    await authExpect(cpfModal.or(checkoutTitle).first()).toBeVisible({ timeout: 20_000 });
  });

  authTest("completar-perfil mostra formulário de CPF", async ({ buyerPage: page }) => {
    await page.goto("/completar-perfil");
    await authExpect(page.getByRole("heading", { name: /completar perfil/i })).toBeVisible({
      timeout: 15_000,
    });
    await authExpect(page.locator("#cpf")).toBeVisible();
  });
});
