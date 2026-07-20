import { describe, expect, it } from "vitest";
import { createShippingProvider } from "../application/shipping/createShippingProvider.js";

describe("ShippingProvider", () => {
  it("stub quotes PAC + SEDEX", async () => {
    const p = createShippingProvider("stub");
    const quotes = await p.quote({
      originCep: "01310100",
      destinationCep: "22041080",
      weightGrams: 500,
    });
    expect(quotes.length).toBeGreaterThanOrEqual(2);
    expect(quotes[0]?.priceCents).toBeGreaterThan(0);
  });

  it("melhor_envio without token throws", () => {
    const prev = process.env.MELHOR_ENVIO_TOKEN;
    delete process.env.MELHOR_ENVIO_TOKEN;
    expect(() => createShippingProvider("melhor_envio")).toThrow(/melhor_envio_token_missing/);
    if (prev) process.env.MELHOR_ENVIO_TOKEN = prev;
  });

  it("skeletons fail closed", async () => {
    for (const name of ["correios", "jadlog", "kangu"] as const) {
      const p = createShippingProvider(name);
      await expect(
        p.quote({ originCep: "01310100", destinationCep: "22041080", weightGrams: 100 }),
      ).rejects.toThrow(/shipping_provider_skeleton/);
    }
  });
});
