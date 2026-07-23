import { test, expect } from "@playwright/test";
import {
  ctaForegroundForPrimary,
  getGameTheme,
  gameThemeCssVars,
  listAllGameThemes,
} from "../../src/lib/experience/game-theme";
import { marketplaceCategoryHref } from "../../src/lib/tcg-product-categories";

/** Relative luminance for WCAG checks in E2E assertions. */
function lum(hex: string): number {
  const raw = hex.replace("#", "").slice(0, 6);
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(raw.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string): number {
  const L1 = lum(a);
  const L2 = lum(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("QA Platform V6.4 — functional regression", () => {
  test("portal theme tokens meet WCAG AA for text and CTA", async () => {
    for (const theme of listAllGameThemes()) {
      const textRatio = contrast(theme.surfaces.text, theme.surfaces.bg);
      const mutedRatio = contrast(theme.surfaces.textMuted, theme.surfaces.bg);
      expect(textRatio, `${theme.gameId} text`).toBeGreaterThanOrEqual(4.5);
      expect(mutedRatio, `${theme.gameId} muted`).toBeGreaterThanOrEqual(4.5);

      const ctaFg = ctaForegroundForPrimary(theme.primary);
      expect(contrast(ctaFg, theme.primary), `${theme.gameId} CTA`).toBeGreaterThanOrEqual(4.5);

      const vars = gameThemeCssVars(theme) as Record<string, string>;
      expect(vars["--game-cta-fg"]).toBe(ctaFg);
      expect(vars["--foreground"]).toBeTruthy();
    }
  });

  test("accessory category hrefs land on /marketplace/produtos", async () => {
    for (const cat of ["sleeve", "deck_box", "playmat", "album", "empty_storage"] as const) {
      const href = marketplaceCategoryHref("mtg", cat);
      expect(href.startsWith("/marketplace/produtos?")).toBe(true);
      expect(href).toContain(`category=${cat}`);
      expect(href).not.toMatch(/^\/marketplace\?/);
      expect(href).not.toMatch(/^\/game/);
      expect(href).not.toMatch(/^\/games/);
    }
  });

  test("marketplace renders products grid or empty state", async ({ page }) => {
    const res = await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });
    expect(res?.ok() || res?.status() === 304).toBeTruthy();

    await expect(
      page.getByTestId("marketplace-product-grid").or(page.getByTestId("marketplace-products-empty")),
    ).toBeVisible({ timeout: 20_000 });

    const grid = page.getByTestId("marketplace-product-grid");
    if (await grid.isVisible().catch(() => false)) {
      const cards = grid.locator("a, [data-testid^='marketplace-product']");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test("marketplace filters remain legible when applied", async ({ page }) => {
    await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });
    const desktop = page.getByTestId("marketplace-filters-desktop");
    await expect(desktop).toBeVisible({ timeout: 15_000 });

    const condition = desktop.getByLabel(/Near Mint|NM|Mint/i).first();
    if (await condition.count()) {
      await condition.check({ force: true });
    }
    await desktop.getByLabel("Preço mínimo").fill("1");

    const color = await desktop.getByLabel("Preço mínimo").evaluate((el) => {
      const styles = window.getComputedStyle(el as HTMLElement);
      return { color: styles.color, bg: styles.backgroundColor, opacity: styles.opacity };
    });
    expect(Number(color.opacity)).toBeGreaterThan(0.5);
    expect(color.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(color.color).not.toBe("transparent");
  });

  test("game logos via next/image do not 400 for quality 60/78", async ({ page }) => {
    const logos = ["mtg", "pokemon", "yugioh", "lorcana"];
    for (const logo of logos) {
      for (const q of [60, 78, 70]) {
        const url = `/_next/image?url=${encodeURIComponent(`/logos/${logo}.webp`)}&w=96&q=${q}`;
        const res = await page.request.get(url);
        expect(res.status(), `${logo} q=${q}`).not.toBe(400);
        expect([200, 304]).toContain(res.status());
      }
    }
  });

  test("portal MTG hero + category chips navigate to marketplace produtos", async ({ page }) => {
    await page.goto("/loja/mtg", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".game-portal")).toBeVisible({ timeout: 15_000 });

    const sleeve = page.getByTestId("category-sleeve");
    if (await sleeve.isVisible().catch(() => false)) {
      await expect(sleeve).toHaveAttribute("href", /\/marketplace\/produtos\?.*category=sleeve/);
      await sleeve.click();
      await page.waitForURL(/\/marketplace\/produtos/, { timeout: 15_000 });
      expect(page.url()).not.toMatch(/\/loja\?from=marketplace/);
    }
  });

  test("PDP path exists for a listed marketplace product", async ({ page }) => {
    await page.goto("/marketplace/produtos", { waitUntil: "domcontentloaded" });
    const grid = page.getByTestId("marketplace-product-grid");
    await expect(
      grid.or(page.getByTestId("marketplace-products-empty")),
    ).toBeVisible({ timeout: 20_000 });

    if (!(await grid.isVisible().catch(() => false))) {
      test.skip(true, "No products in inventory to open PDP");
      return;
    }

    const first = grid.locator("a[href*='/marketplace/product/']").first();
    await expect(first).toBeVisible({ timeout: 10_000 });
    const href = await first.getAttribute("href");
    expect(href).toMatch(/\/marketplace\/product\//);
    await first.click();
    await page.waitForURL(/\/marketplace\/product\//, { timeout: 20_000 });
    await expect(page.locator("h1, [data-testid='product-title']").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
