import { test, expect } from "@playwright/test";

/**
 * Carlos / Marketplace — Product Knowledge Panel (BUG-V4-005 / BUG-V4-012).
 * Uses route mocks — does not depend on live master catalog seed.
 */
test.describe("Product Knowledge Graph panel", () => {
  test.beforeEach(async ({ page }) => {
    // Soften unrelated client fetches that may return empty bodies during PDP load.
    await page.route("**/api/marketplace/shop/cart**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });
  });

  test("renders official contents, specs and downloads from knowledge API", async ({ page }) => {
    const productId = "shop-product-kg-1";
    const masterId = "11111111-1111-1111-1111-111111111111";

    await page.route(`**/api/marketplace/shop/products/${productId}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          product: {
            id: productId,
            name: "Gamegenic Sleeves Official",
            price_cents: 1990,
            stock: 5,
            images: [],
            store_slug: "loja-demo",
            store_name: "Loja Demo",
            master_product_id: masterId,
            master_variant_id: "22222222-2222-2222-2222-222222222222",
          },
        }),
      });
    });

    await page.route(`**/api/product-catalog/products/${masterId}/knowledge**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          product_id: masterId,
          lifecycle: "AVAILABLE",
          official_contents: {
            items: [{ content_type: "sleeve", label: "Sleeves", quantity: 100, unit: "pcs" }],
            pdf_url: "https://example.com/decklist.pdf",
          },
          specifications: [
            {
              id: "spec-1",
              spec_schema: "sleeve",
              width_mm: 66,
              height_mm: 91,
              pieces: 100,
              pvc_free: true,
            },
          ],
          entity_relationships: [
            { relation_type: "compatible_with", to_entity_type: "game", to_game_code: "MTG" },
          ],
          downloads: [{ package_kind: "pdf", title: "Rules", source_url: "https://example.com/rules.pdf" }],
          marketing_files: [],
          release_information: { release_date: "2026-01-01", msrp_cents: 1990 },
          collection: { id: "c1", name: "Gamegenic Line", slug: "gamegenic-line", products: [] },
        }),
      });
    });

    await page.route(`**/api/product-catalog/products/${masterId}/relationships**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto(`/marketplace/product/${productId}`);
    const panel = page.getByTestId("product-knowledge-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText("Conhecimento oficial do produto")).toBeVisible();
    await expect(panel.getByText("Conteúdo oficial")).toBeVisible();
    await expect(panel.getByText("Sleeves", { exact: true })).toBeVisible();
    await expect(panel.getByText("Especificações oficiais")).toBeVisible();
    await expect(panel.getByText("Compatibilidade oficial")).toBeVisible();
    await expect(panel.getByText("Downloads oficiais")).toBeVisible();
  });

  test("shows unbound empty state when listing has no master_product_id (BUG-V4-012)", async ({
    page,
  }) => {
    const productId = "shop-product-unbound-1";

    await page.route((url) => url.pathname.endsWith(`/api/marketplace/shop/products/${productId}`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          product: {
            id: productId,
            name: "Anúncio sem catálogo",
            price_cents: 990,
            stock: 1,
            images: [],
            store_slug: "loja-demo",
            store_name: "Loja Demo",
            master_product_id: null,
            master_variant_id: null,
          },
        }),
      });
    });

    await page.goto(`/marketplace/product/${productId}`);
    await expect(page.getByRole("heading", { name: "Anúncio sem catálogo" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("product-knowledge-unbound")).toBeVisible();
    await expect(page.getByText(/ainda não está vinculado ao catálogo mestre/i)).toBeVisible();
  });
});
