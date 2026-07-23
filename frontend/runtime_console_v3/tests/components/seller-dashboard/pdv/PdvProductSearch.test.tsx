/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PdvProductSearch } from "@/components/seller-dashboard/pdv/PdvProductSearch";
import type { PdvProduct } from "@/types/pdv";

const products: PdvProduct[] = [
  {
    id: "loc-1",
    name: "Chocolate Lacta",
    price_cents: 750,
    stock: 10,
    source: "local",
    local_product_id: "loc-1",
  },
  {
    id: "off-1",
    name: "Dragon Shield",
    price_cents: 7990,
    stock: 5,
    source: "official",
  },
];

describe("PdvProductSearch badges", () => {
  it("mostra badges LOCAL e OFICIAL", () => {
    render(
      <PdvProductSearch products={products} onAdd={() => undefined} onSearch={() => undefined} />,
    );
    expect(screen.getByTestId("pdv-badge-local").textContent).toMatch(/LOCAL/i);
    expect(screen.getByTestId("pdv-badge-official").textContent).toMatch(/OFICIAL/i);
  });
});
