import { test as authTest, expect } from "../fixtures/auth";
import { mockSellerSprintApis } from "../helpers/seller-mock-routes";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Seller dashboard redesign", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("dashboard shows operational metrics", async ({ sellerPage: page }) => {
    await mockSellerSprintApis(page);
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("dashboard-metrics")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Pedidos aguardando pagamento")).toBeVisible();
  });

  authTest("orders page has tabs and search", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/pedidos");
    await waitForSellerPanelReady(page);
    await expect(page.getByRole("tab", { name: "Aguardando pagamento" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Pesquisar por: Pedido, Cliente, CPF, Email, SKU, Rastreio…"),
    ).toBeVisible();
  });

  authTest("legacy vendas redirects to pedidos", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/vendas");
    await expect(page).toHaveURL(/\/vendedor\/painel\/pedidos/, { timeout: 20_000 });
  });

  authTest("legacy listagens redirects to catalogo cartas", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/listagens");
    await expect(page).toHaveURL(/\/vendedor\/painel\/catalogo\/cartas/, { timeout: 20_000 });
  });
});
