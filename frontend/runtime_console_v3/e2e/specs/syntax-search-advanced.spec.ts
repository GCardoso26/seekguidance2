import { test, expect } from "@playwright/test";

test.describe("Syntax search avançado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 15_000 });
  });

  test("autocomplete de valores para campo set", async ({ page }) => {
    const input = page.getByTestId("marketplace-search");
    await input.fill("set:");
    await input.focus();

    const popover = page.getByTestId("syntax-autocomplete-popover");
    await expect(popover).toBeVisible({ timeout: 10_000 });
    await expect(popover.getByText("Dominaria United")).toBeVisible();

    await input.fill("set:dom");
    await expect(popover.getByText("Dominaria United")).toBeVisible();
    await expect(popover.getByText("Modern Horizons 3")).not.toBeVisible();
  });

  test("autocomplete de cor com label", async ({ page }) => {
    const input = page.getByTestId("marketplace-search");
    await input.fill("color:");
    await input.focus();

    const popover = page.getByTestId("syntax-autocomplete-popover");
    await expect(popover).toBeVisible({ timeout: 10_000 });
    await expect(popover.getByText("W (White)")).toBeVisible();
    await popover.getByText("W (White)").click();
    await expect(input).toHaveValue("color:W");
  });

  test("tecla Escape fecha sugestões", async ({ page }) => {
    const input = page.getByTestId("marketplace-search");
    await input.fill("set:");
    await expect(page.getByTestId("syntax-autocomplete-popover")).toBeVisible({ timeout: 10_000 });
    await input.press("Escape");
    await expect(page.getByTestId("syntax-autocomplete-popover")).not.toBeVisible();
  });

  test("navegação com setas e Enter seleciona valor", async ({ page }) => {
    const input = page.getByTestId("marketplace-search");
    await input.fill("color:");
    await expect(page.getByTestId("syntax-autocomplete-popover")).toBeVisible({ timeout: 10_000 });
    await input.press("ArrowDown");
    await input.press("Enter");
    await expect(input).toHaveValue(/color:(W|U|B|R|G)/);
  });
});
