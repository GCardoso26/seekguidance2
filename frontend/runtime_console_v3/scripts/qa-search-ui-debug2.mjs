import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const nets = [];
page.on("response", (r) => {
  if (r.url().includes("/api/catalog/cards/search")) {
    nets.push({ status: r.status(), url: r.url(), len: r.headers()["content-length"] });
  }
});
await page.goto("http://localhost:3000/loja/busca?q=Lightning+Bolt", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(20_000);
const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
console.log(JSON.stringify({
  nets,
  hasCarregando: text.includes("Carregando"),
  hasResultados: /\d+\s+resultados/.test(text),
  hasIndisp: /indisponível/.test(text),
  hasCardName: /Lightning|Bolt|Emeritus/i.test(text),
  snip: text.slice(text.indexOf("resultados") >= 0 ? text.indexOf("resultados") - 20 : 200, 700),
}, null, 2));
await browser.close();
