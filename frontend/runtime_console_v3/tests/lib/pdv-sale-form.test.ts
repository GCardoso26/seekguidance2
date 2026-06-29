import { describe, expect, it } from "vitest";
import {
  buildPdvSaleFormValues,
  cartTotalCents,
  parsePdvSaleForm,
  pdvSaleToApiPayload,
  pdvSaleFormSchema,
} from "@/lib/pdv-sale-form";

describe("pdv-sale-form", () => {
  const items = [
    { product_id: "p1", name: "Booster", price_cents: 1990, quantity: 2 },
    { product_id: "p2", name: "Sleeve", price_cents: 3500, quantity: 1 },
  ];

  it("calcula total do carrinho", () => {
    expect(cartTotalCents(items)).toBe(7480);
  });

  it("monta payload com payment_method cash", () => {
    const payload = pdvSaleToApiPayload(items, "cash");
    expect(payload.payment_method).toBe("cash");
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0]).toEqual({
      product_id: "p1",
      name: "Booster",
      quantity: 2,
      price_cents: 1990,
    });
  });

  it("valida schema e rejeita carrinho vazio", () => {
    const ok = parsePdvSaleForm(buildPdvSaleFormValues(items, "pix"));
    expect(ok.success).toBe(true);

    const bad = parsePdvSaleForm({ items: [], payment_method: "cash" });
    expect(bad.success).toBe(false);
  });

  it("exporta schema zod utilizável", () => {
    expect(pdvSaleFormSchema.shape.payment_method._def.values).toContain("card");
  });
});
