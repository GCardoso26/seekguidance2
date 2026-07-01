import { test, expect } from "@playwright/test";

const main = "#main-content";

test.describe("CardTrader navigation (Epic 22)", () => {
  test("game picker em /loja lista jogos", async ({ page }) => {
    await page.goto("/loja", { waitUntil: "domcontentloaded" });
    await expect(page.locator(main)).toBeVisible();
    await expect(page.getByRole("heading", { name: /marketplace tcg/i })).toBeVisible();
  });

  test("landing por jogo em /mtg", async ({ page }) => {
    await page.goto("/mtg", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/mtg/);
    await expect(page.getByText(/Magic: The Gathering/i).first()).toBeVisible();
  });

  test("listagem de cartas em /mtg/cards com filtros", async ({ page }) => {
    await page.goto("/mtg/cards", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/mtg\/cards/);
    await expect(page.getByRole("searchbox", { name: /buscar cartas/i })).toBeVisible();
    await expect(page.getByLabel(/filtros de busca/i)).toBeVisible();
  });

  test("expansões em /mtg/expansions", async ({ page }) => {
    await page.goto("/mtg/expansions", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/mtg\/expansions/);
    await expect(page.getByRole("heading", { name: /expansões/i })).toBeVisible();
  });

  test("redirect legado /games/mtg → /mtg", async ({ page }) => {
    await page.goto("/games/mtg", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/mtg\/?$/);
  });

  test("redirect legado /loja/mtg/busca → /mtg/cards", async ({ page }) => {
    await page.goto("/loja/mtg/busca", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/mtg\/cards/);
  });

  test("slug inválido retorna 404", async ({ page }) => {
    const res = await page.goto("/not-a-real-tcg-game", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });
});
