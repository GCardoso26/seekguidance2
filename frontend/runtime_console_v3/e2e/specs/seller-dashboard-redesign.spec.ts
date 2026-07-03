import { test, expect } from "@playwright/test";

test.describe("Seller dashboard redesign", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/vendedor/painel");
  });

  test("dashboard shows operational metrics", async ({ page }) => {
    await expect(page.getByTestId("dashboard-metrics")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Pedidos aguardando pagamento")).toBeVisible();
  });

  test("orders page has tabs and search", async ({ page }) => {
    await page.goto("/vendedor/painel/pedidos");
    await expect(page.getByRole("tab", { name: "Aguardando pagamento" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Pesquisar por: Pedido, Cliente, CPF, Email, SKU, Rastreio…"),
    ).toBeVisible();
  });

  test("legacy vendas redirects to pedidos", async ({ page }) => {
    await page.goto("/vendedor/painel/vendas");
    await expect(page).toHaveURL(/\/vendedor\/painel\/pedidos/);
  });

  test("legacy listagens redirects to catalogo cartas", async ({ page }) => {
    await page.goto("/vendedor/painel/listagens");
    await expect(page).toHaveURL(/\/vendedor\/painel\/catalogo\/cartas/);
  });
});
