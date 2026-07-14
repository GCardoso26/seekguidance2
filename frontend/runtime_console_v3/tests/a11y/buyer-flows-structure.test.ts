import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("Buyer flows — estrutura a11y mínima (Sprint 16)", () => {
  it("BuyerDashboardPage expõe landmarks e estados de carregamento", () => {
    const src = readSrc("src/components/buyer/BuyerDashboardPage.tsx");
    expect(src).toContain('aria-busy="true"');
    expect(src).toContain('aria-label="Resumo"');
    expect(src).toMatch(/<h1/);
  });

  it("WishlistPage usa tablist acessível e DND quando v2", () => {
    const src = readSrc("src/components/marketplace/WishlistPage.tsx");
    expect(src).toContain('role="tablist"');
    expect(src).toContain('aria-selected');
    expect(src).toContain("DndContext");
  });

  it("Smart cart define grupo de objetivos com aria-label", () => {
    const src = readSrc("src/app/marketplace/cart/page.tsx");
    expect(src).toContain('aria-label="Objetivo do carrinho"');
  });

  it("Checkout usa barra de progresso", () => {
    const src = readSrc("src/app/checkout/page.tsx");
    expect(src).toContain("CheckoutProgressBar");
  });

  it("SkipToMain disponível para fluxos buyer", () => {
    const src = readSrc("src/components/a11y/SkipToMain.tsx");
    expect(src).toContain("Ir para o conteúdo principal");
  });
});
