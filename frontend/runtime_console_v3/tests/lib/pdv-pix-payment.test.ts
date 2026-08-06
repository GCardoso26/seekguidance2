import { describe, expect, it } from "vitest";
import {
  PDV_PIX_POLL_MS,
  parsePdvPixStatus,
  pdvPixItemsSchema,
  pdvPixRequestPayload,
  shouldStopPixPolling,
} from "@/lib/pdv-pix-payment";

describe("pdv-pix-payment", () => {
  const items = [
    {
      product_id: "p1",
      source: "official" as const,
      name: "Booster",
      price_cents: 1990,
      quantity: 2,
    },
  ];

  it("monta payload PIX com itens do carrinho", () => {
    const payload = pdvPixRequestPayload(items);
    expect(pdvPixItemsSchema.safeParse(payload).success).toBe(true);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].price_cents).toBe(1990);
  });

  it("valida status de polling", () => {
    const ok = parsePdvPixStatus({ status: "paid", sale_id: "sale-1" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(shouldStopPixPolling(ok.data.status)).toBe(true);
    }
  });

  it("rejeita status inválido", () => {
    expect(parsePdvPixStatus({ status: "unknown" }).success).toBe(false);
  });

  it("polling interval é 3 segundos", () => {
    expect(PDV_PIX_POLL_MS).toBe(3000);
  });
});
