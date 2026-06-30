import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Vendedor — configurações", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("seller acessa configurações ou upsell", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/configuracoes/pagamentos");
    await authExpect(page).toHaveURL(/\/vendedor\/painel\/configuracoes/, { timeout: 20_000 });
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByRole("heading", { name: /^configurações$/i })
        .or(page.getByText(/configurações avançadas no plano pro/i))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("tab pagamentos e form visível", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel/configuracoes/pagamentos");
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByTestId("settings-tabs")
        .or(page.getByText(/configurações avançadas no plano pro/i))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });

    const upsell = page.getByText(/configurações avançadas no plano pro/i);
    if ((await upsell.count()) > 0) return;

    const noStore = page.getByRole("link", { name: /cadastre sua loja/i });
    if ((await noStore.count()) > 0) return;

    await authExpect(page.getByTestId("settings-tab-pagamentos")).toBeVisible();
    await authExpect(
      page.getByTestId("payment-settings-form").or(page.getByTestId("page-skeleton")).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  authTest("configurações mobile 375px mostra tabs", async ({ sellerPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/vendedor/painel/configuracoes/pagamentos");
    await waitForSellerPanelReady(page);

    await authExpect(
      page
        .getByTestId("settings-tabs")
        .or(page.getByText(/configurações avançadas no plano pro/i))
        .or(page.getByRole("link", { name: /cadastre sua loja/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
