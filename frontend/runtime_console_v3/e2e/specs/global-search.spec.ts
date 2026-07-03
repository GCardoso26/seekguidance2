import { test as authTest, expect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Global search sprint 4", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("global search finds orders and customers", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("seller-global-search-input")).toBeVisible({ timeout: 15_000 });
    await page.getByPlaceholder("Pesquisar...").fill("185");
    await expect(page.getByText("#18555")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("João Silva")).toBeVisible();
  });
});
