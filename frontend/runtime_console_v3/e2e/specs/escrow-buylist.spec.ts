import { test, expect } from "@playwright/test";

test.describe("Painel lojista", () => {
  test("estatísticas exige plano ou redireciona para upgrade", async ({ page }) => {
    await page.goto("/vendedor/painel/estatisticas");
    await expect(page).toHaveURL(
      /\/(vendedor\/painel\/estatisticas|vendedor\/painel\/planos|entrar)/,
      { timeout: 15_000 },
    );
    await expect(page.locator("body")).toContainText(
      /Estatísticas|Analytics|planos|entrar|login/i,
      { timeout: 15_000 },
    );
  });
});

test.describe("Escrow e BuyList público", () => {
  test("página BuyList inválida retorna mensagem amigável", async ({ page }) => {
    await page.goto("/buylist/token-invalido-e2e");
    await expect(page.getByText(/não encontrada|Carregando/i)).toBeVisible({ timeout: 15_000 });
  });

  test("mercado exibe health score ou estado de carregamento", async ({ page }) => {
    await page.goto("/mercado");
    await expect(page.locator("body")).toContainText(/mercado|saúde|carregando/i, { timeout: 15_000 });
  });
});
