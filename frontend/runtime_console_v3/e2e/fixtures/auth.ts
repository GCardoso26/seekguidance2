import { test as base, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const buyerState = path.join(__dirname, ".auth/buyer.json");
const sellerState = path.join(__dirname, ".auth/seller.json");

function hasAuthState(file: string) {
  return fs.existsSync(file);
}

export const test = base.extend<{
  buyerPage: import("@playwright/test").Page;
  sellerPage: import("@playwright/test").Page;
}>({
  buyerPage: async ({ browser }, use, testInfo) => {
    if (!hasAuthState(buyerState)) {
      testInfo.skip(true, "Auth state not available — run auth setup with SUPABASE_SERVICE_ROLE_KEY");
    }
    const context = await browser.newContext({ storageState: buyerState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  sellerPage: async ({ browser }, use, testInfo) => {
    if (!hasAuthState(sellerState)) {
      testInfo.skip(true, "Auth state not available");
    }
    const context = await browser.newContext({ storageState: sellerState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
