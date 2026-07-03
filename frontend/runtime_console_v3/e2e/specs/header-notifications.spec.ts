import { test as authTest, expect } from "../fixtures/auth";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Header notifications sprint 4", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("notification bell shows badge and dropdown", async ({ sellerPage: page }) => {
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await expect(page.getByTestId("header-notifications-badge")).toHaveText("12", {
      timeout: 20_000,
    });
    await page.getByTestId("header-notifications-bell").click();
    await expect(page.getByText("novos pedidos")).toBeVisible();
  });
});
