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

  authTest("seller vê listagens ou redirecionamento KYC", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/listagens");
    await authExpect(page).toHaveURL(/\/(vendedor\/painel\/listagens|loja\/suspensa|entrar)/, {
      timeout: 20_000,
    });
    if (page.url().includes("/vendedor/painel/listagens")) {
      await authExpect(page.getByRole("heading", { name: /minhas listagens/i })).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});

authTest.describe("Comprador — gate CPF", () => {
  authTest("checkout mostra modal ou página de checkout", async ({ buyerPage: page }) => {
    await page.goto("/marketplace/checkout");
    await authExpect(page).toHaveURL(/\/marketplace\/checkout/);
    const cpfModal = page.getByRole("heading", { name: /cpf obrigatório/i });
    const checkoutTitle = page.getByRole("heading", { name: /^checkout$/i });
    await authExpect(cpfModal.or(checkoutTitle)).toBeVisible({ timeout: 20_000 });
  });

  authTest("completar-perfil mostra formulário de CPF", async ({ buyerPage: page }) => {
    await page.goto("/completar-perfil");
    await authExpect(page.getByRole("heading", { name: /completar perfil/i })).toBeVisible({
      timeout: 15_000,
    });
    await authExpect(page.locator("#cpf")).toBeVisible();
  });
});
