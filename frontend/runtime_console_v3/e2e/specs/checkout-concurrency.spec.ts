import path from "path";
import fs from "fs";
import { test, expect } from "@playwright/test";
import { hasAuthEnv } from "../helpers/supabase-auth";
import {
  addProductToUserCart,
  canRunCheckoutRace,
  getOrCreateRaceProduct,
  getStockQuantity,
  initiateCheckout,
  setupSingleStockItem,
} from "../helpers/checkout";

const buyerA = path.join(__dirname, "../.auth/buyer.json");
const buyerB = path.join(__dirname, "../.auth/buyer-b.json");

function hasBuyerStates() {
  return fs.existsSync(buyerA) && fs.existsSync(buyerB);
}

test.describe("Checkout Concurrency", () => {
  test.beforeEach(() => {
    if (!hasAuthEnv()) {
      test.skip();
    }
  });

  test("deve permitir apenas uma compra quando 2 usuários tentam comprar o último item", async ({
    baseURL,
  }) => {
    test.skip(!canRunCheckoutRace() || !hasBuyerStates(), "Requer auth setup com buyer A e B");

    const productId = process.env.E2E_RACE_PRODUCT_ID ?? (await getOrCreateRaceProduct());
    if (!productId) {
      test.skip(true, "Não foi possível obter produto de teste");
      return;
    }

    await setupSingleStockItem(productId);

    const url = baseURL ?? "http://localhost:3000";
    await Promise.all([
      addProductToUserCart(url, buyerA, productId),
      addProductToUserCart(url, buyerB, productId),
    ]);

    const [result1, result2] = await Promise.all([
      initiateCheckout(url, buyerA),
      initiateCheckout(url, buyerB),
    ]);

    const outcomes = [result1, result2];
    const successCount = outcomes.filter((r) => r.status >= 200 && r.status < 300).length;
    const failureCount = outcomes.filter(
      (r) =>
        r.status === 400 ||
        r.status === 409 ||
        r.status === 423 ||
        r.body.toLowerCase().includes("esgotado") ||
        r.body.toLowerCase().includes("disponível") ||
        r.body.toLowerCase().includes("insuficiente"),
    ).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBeGreaterThanOrEqual(1);

    const availableStock = await getStockQuantity(productId);
    expect(availableStock).toBe(0);
  });
});
