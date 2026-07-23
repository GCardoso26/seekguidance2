"use client";

import { CardImage } from "@/components/ui/CardImage";
import { Button } from "@/components/ui/button";
import { mediaTypeFromCategory } from "@/lib/assets";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { cartLineKey, cartTotalCents } from "@/lib/pdv-sale-form";
import type { PdvCartItem } from "@/types/pdv";

type Props = {
  items: PdvCartItem[];
  onIncrement: (lineKey: string) => void;
  onDecrement: (lineKey: string) => void;
  onRemove: (lineKey: string) => void;
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
    <div className="flex flex-col surface-card p-4" data-testid="pdv-cart">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">Carrinho</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="pdv-cart-empty">
          Escaneie ou busque produtos para começar.
        </p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {items.map((item) => {
            const key = cartLineKey(item);
            return (
              <li
                key={key}
                className="rounded-lg border border-border bg-muted/50 p-3"
                data-testid={`pdv-cart-item-${item.product_id}`}
                data-source={item.source}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted/40">
                      <CardImage
                        src={item.image_url}
                        alt={item.name}
                        fallbackLabel={item.name.slice(0, 8)}
                        mediaType={mediaTypeFromCategory(item.category)}
                        fill
                        listQuality
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.source === "local" ? "LOCAL · " : ""}
                        {formatShopPrice(item.price_cents)} × {item.quantity}
                      </p>
                    </div>
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
                    onClick={() => onDecrement(key)}
                    aria-label={`Diminuir ${item.name}`}
                  >
                    −
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={() => onIncrement(key)}
                    aria-label={`Aumentar ${item.name}`}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive"
                    onClick={() => onRemove(key)}
                    aria-label={`Remover ${item.name}`}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-bold" data-testid="pdv-cart-total">
          {formatShopPrice(total)}
        </span>
      </div>

      <Button
        type="button"
        className="mt-3 w-full"
        disabled={disabled || isFinalizing || items.length === 0}
        onClick={onFinalize}
        data-testid="pdv-finalize-btn"
      >
        {isFinalizing ? "Processando…" : "Finalizar venda"}
      </Button>
    </div>
  );
}
