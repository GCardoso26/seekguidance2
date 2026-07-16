import { expect, test, type Page } from "@playwright/test";

const CARD_ID = "card_lightning";

async function mockSellerApis(page: Page) {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-seller",
        email: "loja@example.com",
        displayName: "Lojista",
      }),
    });
  });

  let roles = ["buyer"];
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-seller",
        refreshToken: "refresh-seller",
        expiresIn: 900,
        userId: "user-seller",
        roles,
        sessionId: "session-seller",
      }),
    });
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-seller-refreshed",
        refreshToken: "refresh-seller",
        expiresIn: 900,
        userId: "user-seller",
        roles,
        sessionId: "session-seller",
      }),
    });
  });

  await page.route("**/api/v1/marketplace/sellers", async (route) => {
    if (route.request().method() === "POST") {
      roles = ["buyer", "seller"];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          sellerId: "seller-1",
          slug: "loja-demo",
          displayName: "Loja Demo",
          profileId: "profile-1",
        }),
      });
      return;
    }
    await route.fallback();
  });

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
              setCode: "M11",
              setName: "Magic 2011",
              language: "en",
              rarity: "Common",
              imageUrl: null,
              priceMin: null,
              currency: null,
              hasStock: false,
            },
          },
        ],
        estimatedTotal: 1,
        tookMs: 1,
        query: "Lightning Bolt",
        projection: "search",
      }),
    });
  });

  await page.route("**/api/v1/variants**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: `${CARD_ID}:nonfoil`,
            cardId: CARD_ID,
            finish: "nonfoil",
            language: "en",
            name: "Lightning Bolt",
            setCode: "M11",
            priceMin: null,
            currency: null,
            hasStock: false,
            imageUrl: null,
          },
        ],
      }),
    });
  });

  await page.route("**/api/v1/marketplace/inventory", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "inv-1", quantity: 1, outcome: "created" }),
    });
  });

  await page.route("**/api/v1/marketplace/listings", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "listing-1",
          sellerId: "seller-1",
          catalogCardId: CARD_ID,
          catalogVariantId: `${CARD_ID}:nonfoil`,
          priceCents: 2000,
          currency: "BRL",
          condition: "NM",
          language: "en",
          finish: "nonfoil",
          notes: null,
          quantity: 1,
          status: "active",
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route(`**/api/v1/marketplace/sellers/seller-1/listings`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "listing-1",
            sellerId: "seller-1",
            catalogCardId: CARD_ID,
            catalogVariantId: `${CARD_ID}:nonfoil`,
            priceCents: 2000,
            currency: "BRL",
            condition: "NM",
            language: "en",
            finish: "nonfoil",
            notes: null,
            quantity: 1,
            status: "active",
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });
}

test("cego: conta → loja → publicar Lightning Bolt", async ({ page }) => {
  await mockSellerApis(page);

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Lojista");
  await page.getByLabel("E-mail").fill("loja@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("E-mail").fill("loja@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/session/);

  await page.goto("/seller");
  await page.getByRole("button", { name: "Criar loja" }).click();
  await expect(page).toHaveURL(/\/seller\/onboard/);
  await page.getByLabel("Nome da loja").fill("Loja Demo");
  await page.getByRole("button", { name: "Criar loja" }).click();

  await expect(page).toHaveURL(/\/seller\/listings\/new/);
  await page.getByLabel("Buscar carta para vender").fill("Lightning Bolt");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("Lightning Bolt")).toBeVisible();
  await page.getByRole("button", { name: "Selecionar" }).click();

  await page.getByLabel("Preço (R$)").fill("20");
  await page.getByRole("button", { name: /Publicar anúncio/i }).click();

  await expect(page.getByText(/Lightning Bolt publicada/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver anúncio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Meus anúncios" })).toBeVisible();
});
