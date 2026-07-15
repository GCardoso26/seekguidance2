import { test, expect } from "@playwright/test";

const COUNT_RE = /^\d{1,3}(\.\d{3})*$/;
const HYDRATION_RE = /#418\b|#425\b|Minified React error #(418|425)|Hydration failed|did not match/i;

test.describe("Home hydration", () => {
  test("não mostra erro de boundary e mantém contagem estável", async ({ page }) => {
    test.setTimeout(90_000);

    const hydrationMessages: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && HYDRATION_RE.test(msg.text())) {
        hydrationMessages.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      if (HYDRATION_RE.test(err.message)) {
        hydrationMessages.push(err.message);
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/Algo deu errado/i)).toHaveCount(0);
    await expect(page.getByTestId("hero-title")).toBeVisible({ timeout: 20_000 });

    const countLabel = page.locator("text=/\\d[\\d.]*\\+ cartas/");
    await expect(countLabel.first()).toBeVisible({ timeout: 15_000 });
    const text = (await countLabel.first().textContent()) ?? "";
    const match = text.match(/([\d.]+)\+/);
    expect(match?.[1], `contagem inválida em "${text}"`).toMatch(COUNT_RE);

    // Dá tempo ao hydrate + console de mismatch
    await page.waitForTimeout(2_000);
    expect(hydrationMessages, hydrationMessages.join("\n")).toEqual([]);
  });
});
