import { test, expect } from "@playwright/test";

/**
 * Customer Conversion First — smoke de conversão.
 * Não inventa liquidez; valida UX buy-first e rotas.
 */
test.describe("Customer Conversion First", () => {
  test("/search?q=Rapunzel redireciona para loja (não torneios)", async ({ page }) => {
    await page.goto("/search?q=Rapunzel");
    await expect(page).toHaveURL(/\/loja\/busca/);
    await expect(page.getByText("Descobrir Torneios")).toHaveCount(0);
    await expect(page.getByTestId("loja-busca-title")).toBeVisible({ timeout: 30_000 });
  });

  test("home first viewport comunica compra", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-title")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("hero-title")).toContainText(/comprar/i);
    await expect(page.getByTestId("home-category-strip")).toBeVisible();
    await expect(page.getByTestId("home-cat-singles")).toBeVisible();
    await expect(page.getByTestId("home-cat-selados")).toBeVisible();
    await expect(page.getByTestId("home-cat-acessorios")).toBeVisible();
  });

  test("Singles / Selados / Acessórios em ≤2 cliques", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-cat-singles").click();
    await expect(page).toHaveURL(/\/loja\/singles/);
    await expect(page.getByTestId("hub-singles-title")).toBeVisible();

    await page.goto("/");
    await page.getByTestId("home-cat-selados").click();
    await expect(page).toHaveURL(/\/loja\/selados/);
    await expect(page.getByTestId("hub-selados-title")).toBeVisible();

    await page.goto("/");
    await page.getByTestId("home-cat-acessorios").click();
    await expect(page).toHaveURL(/\/loja\/acessorios/);
    await expect(page.getByTestId("hub-acessorios-title")).toBeVisible();
  });

  test("torneios permanecem acessíveis em /search/torneios", async ({ page }) => {
    await page.goto("/search/torneios");
    await expect(page.getByTestId("torneios-title")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("torneios-title")).toHaveText("Descobrir Torneios");
  });

  for (const q of [
    "Rapunzel",
    "Charizard",
    "Black Lotus",
    "Dragon Shield",
    "Perfect Fit",
    "Booster Lorcana",
    "Playmat",
    "Deck Box",
  ]) {
    test(`busca loja carrega para “${q}” sem página de torneio`, async ({ page }) => {
      await page.goto(`/loja/busca?q=${encodeURIComponent(q)}`);
      await expect(page.getByText("Descobrir Torneios")).toHaveCount(0);
      await expect(page.getByTestId("loja-busca-title")).toBeVisible({ timeout: 30_000 });
      // Ou resultados OU empty state honesto — nunca blank
      const body = page.locator("body");
      await expect(body).not.toBeEmpty();
    });
  }
});
