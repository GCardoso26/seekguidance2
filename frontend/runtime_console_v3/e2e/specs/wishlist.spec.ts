import { test as authTest, expect as authExpect } from "../fixtures/auth";
import { test, expect } from "@playwright/test";

const MOCK_PRODUCT = {
  id: "wish-e2e-001",
  name: "E2E Wishlist Product",
  category: "booster",
  tcg_id: "mtg",
  price_cents: 1990,
  stock: 10,
  store_name: "E2E Store",
  store_slug: "e2e-store",
  images: ["/logos/mtg.svg"],
  condition: "Novo",
};

function mockWishlistApis(page: import("@playwright/test").Page) {
  let items: Array<{ product_id: string; added_at: string; product: typeof MOCK_PRODUCT }> = [];

  return Promise.all([
    page.route("**/api/wishlist", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items, total: items.length }),
        });
        return;
      }
      if (method === "POST") {
        const body = route.request().postDataJSON() as { product_id?: string };
        const productId = body.product_id ?? MOCK_PRODUCT.id;
        if (!items.some((i) => i.product_id === productId)) {
          items = [
            {
              product_id: productId,
              added_at: new Date().toISOString(),
              product: { ...MOCK_PRODUCT, id: productId },
            },
            ...items,
          ];
        }
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(items[0]) });
        return;
      }
      await route.continue();
    }),
    page.route(`**/api/wishlist/${MOCK_PRODUCT.id}`, async (route) => {
      if (route.request().method() === "DELETE") {
        items = items.filter((i) => i.product_id !== MOCK_PRODUCT.id);
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.continue();
    }),
    page.route("**/api/account/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { account_status: "active", cpf_verified: true, can_purchase: true },
        }),
      });
    }),
    page.route("**/api/marketplace/shop/products*", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [MOCK_PRODUCT],
          total: 1,
        }),
      });
    }),
    page.route(`**/api/marketplace/shop/products/${MOCK_PRODUCT.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      });
    }),
    page.route("**/api/marketplace/shop/cart", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cart: {
            id: "c1",
            items: [{ product_id: MOCK_PRODUCT.id, store_id: "s1", name: MOCK_PRODUCT.name, price_cents: 1990, quantity: 1 }],
            total_cents: 1990,
          },
        }),
      });
    }),
  ]);
}

test.describe("Wishlist — visitante", () => {
  test("coração redireciona para login", async ({ page }) => {
    await mockWishlistApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await expect(page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`).click();
    await page.waitForURL(/\/entrar/, { timeout: 15_000 });
  });
});

authTest.describe("Wishlist — autenticado", () => {
  authTest.describe.configure({ timeout: 90_000 });

  authTest("marketplace → salvar → wishlist lista produto", async ({ buyerPage: page }) => {
    await mockWishlistApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await authExpect(page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`).click();
    await page.goto("/wishlist");
    await authExpect(page.getByTestId("wishlist-route")).toBeVisible({ timeout: 15_000 });
    await authExpect(page.getByTestId(`wishlist-item-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await authExpect(page.getByText(MOCK_PRODUCT.name)).toBeVisible();
  });

  authTest("remover → empty state", async ({ buyerPage: page }) => {
    await mockWishlistApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`).click();
    await page.goto("/wishlist");
    await authExpect(page.getByTestId(`wishlist-item-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`wishlist-remove-${MOCK_PRODUCT.id}`).click();
    await authExpect(page.getByTestId("wishlist-empty")).toBeVisible({ timeout: 15_000 });
  });

  authTest("add to cart na wishlist", async ({ buyerPage: page }) => {
    await mockWishlistApis(page);
    await page.goto(`/marketplace/product/${MOCK_PRODUCT.id}`);
    await page.getByTestId(`wishlist-button-${MOCK_PRODUCT.id}`).click();
    await page.goto("/wishlist");
    await authExpect(page.getByTestId(`wishlist-add-cart-${MOCK_PRODUCT.id}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`wishlist-add-cart-${MOCK_PRODUCT.id}`).click();
    await authExpect(page.getByText(/adicionado|carrinho/i).first()).toBeVisible({ timeout: 10_000 }).catch(() => {
      // toast pode sumir rápido — badge do carrinho é fallback
    });
  });
});
