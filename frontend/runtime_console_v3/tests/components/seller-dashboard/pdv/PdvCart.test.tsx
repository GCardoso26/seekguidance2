/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PdvCart } from "@/components/seller-dashboard/pdv/PdvCart";
import type { PdvCartItem } from "@/types/pdv";

const items: PdvCartItem[] = [
  { product_id: "a", name: "Charizard", price_cents: 5000, quantity: 1 },
  { product_id: "b", name: "Pikachu", price_cents: 1200, quantity: 2 },
];

describe("PdvCart", () => {
  beforeEach(() => cleanup());

  it("mostra empty state sem itens", () => {
    render(
      <PdvCart
        items={[]}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
        onFinalize={vi.fn()}
      />,
    );
    expect(screen.getByTestId("pdv-cart-empty")).toBeTruthy();
  });

  it("calcula total e dispara ações", () => {
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();
    const onRemove = vi.fn();
    const onFinalize = vi.fn();

    render(
      <PdvCart
        items={items}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
        onFinalize={onFinalize}
      />,
    );

    expect(screen.getByTestId("pdv-cart-total").textContent).toMatch(/R\$\s*74,00/);

    fireEvent.click(screen.getByLabelText("Aumentar Charizard"));
    expect(onIncrement).toHaveBeenCalledWith("a");

    fireEvent.click(screen.getAllByText("Remover")[0]!);
    expect(onRemove).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("pdv-finalize-btn"));
    expect(onFinalize).toHaveBeenCalled();
  });
});
