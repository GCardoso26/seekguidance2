import { chromium } from "@playwright/test";
import fs from "fs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONS", m.text().slice(0, 220));
});
page.on("response", async (r) => {
  if (r.url().includes("/api/catalog/cards/search")) {
    const t = await r.text().catch(() => "");
    console.log("NET", r.status(), r.url().slice(0, 140), t.slice(0, 140));
  }
});
await page.goto("http://localhost:3000/loja/busca?q=Lightning+Bolt", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(12_000);
const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
console.log("TEXT", text.slice(0, 900));
console.log(
  "LINKS",
  await page.locator("a[href*='/loja/cartas'], a[href*='/cards/']").count(),
);
console.log("ALERT", await page.locator("text=indisponível").count());
fs.mkdirSync("test-results/qa-sandbox", { recursive: true });
await page.screenshot({ path: "test-results/qa-sandbox/search-ui-p0.png", fullPage: true });
await browser.close();
