import { test, expect } from "@playwright/test";

test.describe("Seller catalog sprint 2", () => {
  test("catalog cards page shows games and search", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/cartas");
    await expect(page.getByText("Magic")).toBeVisible({ timeout: 15_000 });
    await page.getByPlaceholder("Pesquisar carta…").fill("Lightning");
    await expect(page.getByText("Lightning Bolt")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Seller products", () => {
  test("products page shows categories", async ({ page }) => {
    await page.goto("/vendedor/painel/catalogo/produtos");
    await expect(page.getByText("Sleeves")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Deck Box")).toBeVisible();
  });
});

test.describe("Seller customers", () => {
  test("customer drawer shows gamification tab", async ({ page }) => {
    await page.goto("/vendedor/painel/clientes/lista");
    await page.getByText("João").click();
    await expect(page.getByText("Gamificação")).toBeVisible();
    await page.getByText("Gamificação").click();
    await expect(page.getByText("Nível")).toBeVisible();
  });
});

test.describe("Seller tickets", () => {
  test("tickets page shows tabs and creates ticket", async ({ page }) => {
    await page.goto("/vendedor/painel/atendimento/tickets");
    await expect(page.getByText("Abertos")).toBeVisible({ timeout: 15_000 });
    await page.getByText("+ Novo Ticket").click();
    await page.getByLabel("Assunto").fill("Pedido não recebido");
    await page.getByText("Criar").click();
    await expect(page.getByText("Ticket criado")).toBeVisible({ timeout: 10_000 });
  });
});
