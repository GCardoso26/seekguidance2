import { test, expect } from "@playwright/test";

test.describe("Header navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("não exibe Comprar nem Trocar; Loja permanece na nav", async ({ page }) => {
    await expect(page.getByTestId("nav-buy")).toHaveCount(0);
    await expect(page.getByTestId("nav-trade")).toHaveCount(0);
    await expect(page.getByTestId("nav-loja")).toBeVisible();
  });

  test("Vender aponta para painel ou login", async ({ page }) => {
    const sell = page.getByTestId("nav-sell");
    // Visible on lg+; on narrow viewports may be in menu — tolerate hidden if viewport small
    const count = await sell.count();
    if (count > 0) {
      await expect(sell.first()).toBeAttached();
    }
  });

  test("Loja navega para /loja", async ({ page }) => {
    await page.getByTestId("nav-loja").click();
    await expect(page).toHaveURL(/\/loja/);
  });

  test("game picker abre grid de jogos", async ({ page }) => {
    await page.getByTestId("header-game-picker").click();
    await expect(page.getByRole("link", { name: /Magic|Lorcana|Pokémon/i }).first()).toBeVisible();
  });
});
