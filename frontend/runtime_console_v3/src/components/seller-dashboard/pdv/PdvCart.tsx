"use client";

import { Button } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { cartTotalCents } from "@/lib/pdv-sale-form";
import type { PdvCartItem } from "@/types/pdv";

type Props = {
  items: PdvCartItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onFinalize: () => void;
  isFinalizing?: boolean;
  disabled?: boolean;
};

export function PdvCart({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onFinalize,
  isFinalizing,
  disabled,
}: Props) {
  const total = cartTotalCents(items);

  return (
    <div
      className="flex flex-col surface-card p-4"
      data-testid="pdv-cart"
    >
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">Carrinho</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="pdv-cart-empty">
          Escaneie ou busque produtos para começar.
        </p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {items.map((item) => (
            <li
              key={item.product_id}
              className="rounded-lg border border-border bg-muted/50 p-3"
              data-testid={`pdv-cart-item-${item.product_id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShopPrice(item.price_cents)} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-primary">
                  {formatShopPrice(item.price_cents * item.quantity)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={() => onDecrement(item.product_id)}
                  aria-label={`Diminuir ${item.name}`}
                >
                  −
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={() => onIncrement(item.product_id)}
                  aria-label={`Aumentar ${item.name}`}
                >
                  +
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-danger"
                  onClick={() => onRemove(item.product_id)}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span data-testid="pdv-cart-total">{formatShopPrice(total)}</span>
        </div>
        <Button
          type="button"
          className="mt-3 w-full"
          disabled={!items.length || disabled || isFinalizing}
          onClick={onFinalize}
          data-testid="pdv-finalize-btn"
        >
          {isFinalizing ? "Finalizando…" : "Finalizar venda"}
        </Button>
      </div>
    </div>
  );
}
