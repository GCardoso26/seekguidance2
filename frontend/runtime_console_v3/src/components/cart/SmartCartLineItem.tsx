"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Counter from "@/components/react-bits/Counter";
import { Button } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { ShopCartItem } from "@/lib/marketplace-shop";
import { cn } from "@/lib/utils";

type Props = {
  item: ShopCartItem;
  onUpdateQty: (productId: string, quantity: number) => void;
  className?: string;
};

export function SmartCartLineItem({ item, onUpdateQty, className }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs",
        className,
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {item.image ? (
          <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full items-center justify-center text-caption text-muted-foreground">TCG</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-small font-medium leading-snug">{item.name}</p>
        <p className="mt-0.5 font-mono text-caption text-muted-foreground">
          {formatShopPrice(item.price_cents)} · un.
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="font-mono text-small font-semibold tabular-nums">
          {formatShopPrice(item.price_cents * item.quantity)}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Diminuir quantidade"
            onClick={() => onUpdateQty(item.product_id, item.quantity - 1)}
          >
            {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </Button>
          <span className="min-w-[1.5rem] text-center text-small font-medium tabular-nums" aria-live="polite">
            {reduceMotion ? (
              item.quantity
            ) : (
              <Counter
                value={item.quantity}
                fontSize={14}
                padding={0}
                gap={0}
                horizontalPadding={0}
                borderRadius={0}
                gradientHeight={0}
                gradientFrom="transparent"
                gradientTo="transparent"
                textColor="inherit"
                fontWeight={500}
              />
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Aumentar quantidade"
            onClick={() => onUpdateQty(item.product_id, item.quantity + 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
