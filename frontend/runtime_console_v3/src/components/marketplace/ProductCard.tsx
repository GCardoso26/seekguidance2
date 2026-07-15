"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/ui/CardImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShopPrice, type ShopProduct } from "@/lib/marketplace-shop";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { PriceAlertButton } from "@/components/marketplace/PriceAlertButton";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

type Props = {
  product: ShopProduct;
  onAdd?: (productId: string) => void;
};

function isNewProduct(createdAt: string | null | undefined, nowMs: number): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
  return created >= weekAgo;
}

export function ProductCard({ product, onAdd }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const image = product.images?.[0];
  const gameToken = product.tcg_id ? GAME_TOKENS[product.tcg_id as GameId] : null;
  const showNew = mounted && isNewProduct(product.created_at, Date.now());
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-200 hover:border-primary/25 hover:shadow-card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link href={`/marketplace/product/${product.id}`} className="block h-full w-full">
          <CardImage
            src={image}
            alt={product.name}
            fallbackLabel={product.name}
            fill
            listQuality
            className={cn(
              "object-cover transition-transform duration-300",
              isHovered && "scale-[1.03]",
            )}
            sizes="(max-width:768px) 50vw, 25vw"
          />
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {showNew && <Badge variant="warning">Novo</Badge>}
          {outOfStock && <Badge variant="danger">Esgotado</Badge>}
        </div>

        <div
          className={cn(
            "absolute bottom-2 right-2 z-10 flex gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-90",
          )}
        >
          <PriceAlertButton productId={product.id} product={product} size="sm" />
          <WishlistButton productId={product.id} product={product} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="space-y-1">
          <Link
            href={`/marketplace/product/${product.id}`}
            className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {product.name}
          </Link>
          {gameToken && (
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              {gameToken.name}
            </p>
          )}
        </div>

        {product.store_name && product.store_slug && (
          <Link
            href={`/marketplace/loja/${product.store_slug}`}
            className="text-small text-muted-foreground transition-colors hover:text-primary"
          >
            {product.store_name}
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {product.condition && <Badge variant="secondary">{product.condition}</Badge>}
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <p className="font-mono text-lg font-semibold tracking-tight text-foreground">
            {formatShopPrice(product.price_cents)}
          </p>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={outOfStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd?.(product.id);
            }}
          >
            {outOfStock ? "Indisponível" : "Adicionar ao carrinho"}
          </Button>
        </div>
      </div>
    </article>
  );
}
