import { expect, test, type Page } from "@playwright/test";

const CARD_ID = "card_lightning";
const LISTING_ID = "listing-bolt";

async function mockCommerceApis(page: Page) {
  const carts = new Map<
    string,
    {
      id: string;
      status: string;
      items: Array<{
        id: string;
        listingId: string;
        catalogVariantId: string;
        quantity: number;
        priceSnapshotCents: number;
        currency: string;
      }>;
      totalCents: number;
      currency: string;
    }
  >();

  await page.route("**/api/v1/auth/register", async (route) => {
    const body = route.request().postDataJSON() as { email: string };
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: `user-${body.email}`,
        email: body.email,
        displayName: "User",
      }),
    });
  });

  await page.route("**/api/v1/auth/login", async (route) => {
    const body = route.request().postDataJSON() as { email: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: `access-${body.email}`,
        refreshToken: `refresh-${body.email}`,
        expiresIn: 900,
        userId: `user-${body.email}`,
        roles: ["buyer"],
        sessionId: `session-${body.email}`,
      }),
    });
  });

  let rolesAfterRefresh = ["buyer"];
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-refreshed",
        refreshToken: "refresh",
        expiresIn: 900,
        userId: "user",
        roles: rolesAfterRefresh,
        sessionId: "session",
      }),
    });
  });

  await page.route("**/api/v1/marketplace/sellers", async (route) => {
    if (route.request().method() === "POST") {
      rolesAfterRefresh = ["buyer", "seller"];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          sellerId: "seller-1",
          slug: "loja",
          displayName: "Card Shop",
          profileId: "p1",
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
              priceMin: 20,
              currency: "BRL",
              hasStock: true,
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
          id: LISTING_ID,
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

  await page.route(`**/api/v1/cards/${CARD_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: CARD_ID,
        name: "Lightning Bolt",
        setCode: "M11",
        setName: "Magic 2011",
        language: "en",
        rarity: "Common",
        imageUrl: null,
        priceMin: null,
        currency: null,
        hasStock: true,
        oracleText: "Deals 3 damage.",
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
              id: LISTING_ID,
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

  await page.route("**/api/v1/cart", async (route) => {
    if (route.request().method() === "POST") {
      const id = "cart-e2e";
      const cart = {
        id,
        status: "open",
        items: [] as Array<{
          id: string;
          listingId: string;
          catalogVariantId: string;
          quantity: number;
          priceSnapshotCents: number;
          currency: string;
        }>,
        totalCents: 0,
        currency: "BRL",
      };
      carts.set(id, cart);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/cart/**", async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split("/").filter(Boolean);
    // api v1 cart :id [items :itemId]
    const cartId = parts[3]!;
    const cart = carts.get(cartId);
    if (!cart) {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: "cart_not_found" }) });
      return;
    }

    if (route.request().method() === "GET" && parts.length === 4) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
      return;
    }

    if (route.request().method() === "POST" && parts[4] === "items") {
      const body = route.request().postDataJSON() as { listingId: string; quantity?: number };
      const qty = body.quantity ?? 1;
      const existing = cart.items.find((i) => i.listingId === body.listingId);
      if (existing) {
        existing.quantity += qty;
      } else {
        cart.items.push({
          id: `item-${cart.items.length + 1}`,
          listingId: body.listingId,
          catalogVariantId: `${CARD_ID}:nonfoil`,
          quantity: qty,
          priceSnapshotCents: 2000,
          currency: "BRL",
        });
      }
      cart.totalCents = cart.items.reduce(
        (s, i) => s + i.priceSnapshotCents * i.quantity,
        0,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
      return;
    }

    if (route.request().method() === "DELETE" && parts[4] === "items") {
      const itemId = parts[5]!;
      cart.items = cart.items.filter((i) => i.id !== itemId);
      cart.totalCents = cart.items.reduce(
        (s, i) => s + i.priceSnapshotCents * i.quantity,
        0,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/v1/checkout", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { cartId: string };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          checkoutSessionId: "chk-e2e",
          status: "CREATED",
          orderId: "ord-e2e",
          cartId: body.cartId,
        }),
      });
      return;
    }
    await route.fallback();
  });
}

test("vertical: seller publica → buyer adiciona → checkout CREATED", async ({ page }) => {
  await mockCommerceApis(page);

  // Seller path
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Seller");
  await page.getByLabel("E-mail").fill("loja@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("E-mail").fill("loja@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/session/);

  await page.goto("/seller/onboard");
  await page.getByLabel("Nome da loja").fill("Card Shop");
  await page.getByRole("button", { name: "Criar loja" }).click();
  await expect(page).toHaveURL(/\/seller\/listings\/new/);

  await page.getByLabel("Buscar carta para vender").fill("Lightning Bolt");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: "Selecionar" }).click();
  await page.getByLabel("Preço (R$)").fill("20");
  await page.getByRole("button", { name: /Publicar anúncio/i }).click();
  await expect(page.getByText(/Lightning Bolt publicada/)).toBeVisible();

  // Buyer path (new session)
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Buyer");
  await page.getByLabel("E-mail").fill("buyer@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("E-mail").fill("buyer@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/session/);

  await page.goto("/");
  await page.getByLabel("Buscar carta").fill("Lightning Bolt");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("link", { name: "Ver ofertas" }).click();

  await expect(page.getByTestId("catalog-block")).toBeVisible();
  await expect(page.getByTestId("offers-block")).toBeVisible();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByText(/Adicionado/)).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByTestId("cart-page")).toBeVisible();
  await expect(page.getByText("Lightning Bolt")).toBeVisible();
  await expect(page.getByText("Card Shop")).toBeVisible();
  await expect(page.getByText("NM")).toBeVisible();
  await expect(page.getByText(/Total:.*R\$/)).toBeVisible();
  // No technical IDs in cart UI
  await expect(page.getByText(LISTING_ID)).toHaveCount(0);
  await expect(page.getByText(/catalogVariant/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Continuar compra" }).click();
  await expect(page).toHaveURL(/\/checkout\?session=/);
  await expect(page.getByTestId("checkout-started")).toBeVisible();
  await expect(page.getByText("CREATED")).toBeVisible();
  await expect(page.getByText("chk-e2e")).toBeVisible();
});
