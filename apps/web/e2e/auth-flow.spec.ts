import { expect, test, type Page } from "@playwright/test";

async function mockAuthApi(page: Page, roles: string[] = ["buyer"]) {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        email: "seller@example.com",
        displayName: "Seller",
      }),
    });
  });

  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-e2e",
        refreshToken: "refresh-e2e",
        expiresIn: 900,
        userId: "user-1",
        roles,
        sessionId: "session-e2e",
      }),
    });
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-e2e-refreshed",
        refreshToken: "refresh-e2e",
        expiresIn: 900,
        userId: "user-1",
        roles,
        sessionId: "session-e2e",
      }),
    });
  });

  await page.route("**/api/v1/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
}

test("register → login → session → seller home (buyer CTA)", async ({ page }) => {
  await mockAuthApi(page, ["buyer"]);

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Seller Demo");
  await page.getByLabel("E-mail").fill("seller@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("E-mail").fill("seller@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/session/);
  await expect(page.getByText("authenticated")).toBeVisible();
  await expect(page.getByText("buyer")).toBeVisible();

  await page.goto("/seller");
  await expect(page.getByRole("heading", { name: "Portal do vendedor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar loja" })).toBeVisible();

  await page.goto("/seller/listings/new");
  await expect(page.getByText("Acesso restrito")).toBeVisible();
});

test("seller role acessa portal com CTAs de publicação", async ({ page }) => {
  await mockAuthApi(page, ["buyer", "seller"]);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("seller@example.com");
  await page.getByLabel("Senha").fill("password12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/session/);

  await page.goto("/seller");
  await expect(page.getByRole("heading", { name: "Portal do vendedor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar anúncio" })).toBeVisible();
});
