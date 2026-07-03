import { test as authTest, expect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Seller team sprint 3", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("team page shows users and permissions", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/equipe/usuarios");
    await waitForSellerPanelReady(page);
    await expect(page.getByText("Ana Paula")).toBeVisible({ timeout: 20_000 });
    await page.getByText("Ana Paula").click();
    await expect(page.getByText("Permissões")).toBeVisible();
    await page.getByText("Permissões").click();
    await expect(page.getByText("Pedidos")).toBeVisible();
    await expect(page.getByLabel(/Pedidos.*Visualizar/)).toBeChecked();
  });

  authTest("team logs page shows audit entries", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/equipe/logs");
    await waitForSellerPanelReady(page);
    await expect(page.getByText("Logs de auditoria")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("team.invite")).toBeVisible();
  });
});

authTest.describe("Seller finance sprint 3", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("finance page shows revenue chart", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/financeiro/receitas");
    await waitForSellerPanelReady(page);
    await expect(page.getByText("Receitas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("finance-revenue-chart")).toBeVisible();
  });

  authTest("payouts page shows pending balance", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/financeiro/repasses");
    await waitForSellerPanelReady(page);
    await expect(page.getByText("Repasses")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Pendente")).toBeVisible();
  });
});
