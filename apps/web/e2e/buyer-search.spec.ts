import { expect, test, type Page } from "@playwright/test";

const CARD_ID = "card_lightning";

async function mockBuyerApis(page: Page) {
  await page.route("**/api/v1/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hits: [
          {
            card: {
              id: CARD_ID,
              name: "Lightning Bolt",
              setCode: "LEA",
              setName: "Limited Edition Alpha",
              language: "en",
              rarity: "Common",
              imageUrl: null,
              priceMin: null,
              currency: null,
              hasStock: true,
            },
            score: 1,
          },
        ],
        estimatedTotal: 1,
        tookMs: 2,
        query: "Lightning Bolt",
        projection: "search",
      }),
    });
  });

  await page.route(`**/api/v1/cards/${CARD_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: CARD_ID,
        name: "Lightning Bolt",
        setCode: "LEA",
        setName: "Limited Edition Alpha",
        language: "en",
        rarity: "Common",
        imageUrl: null,
        priceMin: null,
        currency: null,
        hasStock: true,
        oracleText: "Lightning Bolt deals 3 damage to any target.",
        finishes: ["nonfoil"],
        storeIds: ["seller-1"],
        stockTotal: 1,
        priceMax: null,
        updatedAt: new Date().toISOString(),
        projection: "search",
      }),
    });
  });

  await page.route(
    `**/api/v1/marketplace/cards/${CARD_ID}/offers`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          catalogCardId: CARD_ID,
          offerCount: 1,
          bestPriceCents: 2000,
          currency: "BRL",
          offers: [
            {
              id: "listing-1",
              sellerId: "seller-1",
              catalogCardId: CARD_ID,
              catalogVariantId: "var-1",
              priceCents: 2000,
              currency: "BRL",
              condition: "NM",
              language: "en",
              finish: null,
              notes: null,
              quantity: 2,
              status: "active",
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    },
  );

  await page.route("**/api/v1/marketplace/sellers/seller-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "seller-1",
        displayName: "Card Shop",
        slug: "card-shop",
        status: "active",
        verification: "none",
      }),
    });
  });
}

test("busca → PDP com Catalog separado de Ofertas", async ({ page }) => {
  await mockBuyerApis(page);

  await page.goto("/");
  await page.getByLabel("Buscar carta").fill("Lightning Bolt");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByRole("heading", { name: "Lightning Bolt" })).toBeVisible();
  await expect(page.getByText(/Ver ofertas/)).toBeVisible();
  // search list must not show marketplace price
  await expect(page.getByText("R$")).toHaveCount(0);

  await page.getByRole("link", { name: "Ver ofertas" }).click();
  await expect(page).toHaveURL(new RegExp(`/cards/${CARD_ID}`));

  const catalog = page.getByTestId("catalog-block");
  const offers = page.getByTestId("offers-block");

  await expect(catalog).toBeVisible();
  await expect(catalog.getByText("Catalog")).toBeVisible();
  await expect(catalog.getByRole("heading", { name: "Lightning Bolt" })).toBeVisible();
  await expect(catalog.getByText(/deals 3 damage/)).toBeVisible();
  // Critério: nenhum dado de Seller no bloco Catalog
  await expect(catalog.getByText("Card Shop")).toHaveCount(0);
  await expect(catalog.getByText("R$")).toHaveCount(0);
  await expect(catalog.getByText("NM")).toHaveCount(0);

  await expect(offers).toBeVisible();
  await expect(offers.getByText("Ofertas")).toBeVisible();
  await expect(offers.getByText("Card Shop")).toBeVisible();
  await expect(offers.getByText("NM")).toBeVisible();
  await expect(offers.getByText(/R\$\s*20/)).toBeVisible();
});
