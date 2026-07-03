import { test as authTest, expect } from "../fixtures/auth";
import { mockSellerSprintApis } from "../helpers/seller-mock-routes";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Global search sprint 4", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("global search finds orders and customers", async ({ sellerPage: page }) => {
    await mockSellerSprintApis(page);
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    const trigger = page.getByTestId("seller-global-search-trigger");
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Busca global" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("seller-global-search-input")).toBeVisible({ timeout: 15_000 });
    await page.getByPlaceholder("Pesquisar...").fill("185");
    await expect(page.getByText("#18555")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("João Silva")).toBeVisible();
  });
});
