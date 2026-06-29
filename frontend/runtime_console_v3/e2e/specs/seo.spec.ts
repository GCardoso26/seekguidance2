import { test, expect } from "@playwright/test";

test.describe("SEO basics", () => {
  test("home has title and meta description", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Judge TCG/i);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /.+/);
  });

  test("loja/mtg page loads", async ({ page }) => {
    await page.goto("/loja/mtg", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page.locator("#main-content").first()).toBeVisible({ timeout: 15_000 });
  });

  test("robots.txt accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("Sitemap");
  });

  test("sitemap.xml accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("<urlset");
  });
});
