import { test as authTest, expect } from "../fixtures/auth";
import { mockSellerSprintApis } from "../helpers/seller-mock-routes";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

authTest.describe("Global command palette sprint 11", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("command palette finds orders and customers", async ({ sellerPage: page }) => {
    await mockSellerSprintApis(page);
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    const trigger = page.getByTestId("seller-global-search-trigger");
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    await expect(page.getByTestId("global-command-palette")).toBeVisible({ timeout: 15_000 });
    const input = page.getByTestId("global-command-palette-input");
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill("185");
    await expect(page.getByText("#18555")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("João Silva")).toBeVisible();
  });

  authTest("Ctrl+K opens command palette", async ({ sellerPage: page }) => {
    await mockSellerSprintApis(page);
    await page.goto("/vendedor/painel");
    await waitForSellerPanelReady(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("global-command-palette")).toBeVisible({ timeout: 15_000 });
  });
});
