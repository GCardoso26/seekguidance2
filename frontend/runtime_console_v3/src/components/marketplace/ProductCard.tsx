"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/ui/CardImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mediaTypeFromCategory, primaryProductImageUrl } from "@/lib/assets";
import { formatShopPrice, type ShopProduct } from "@/lib/marketplace-shop";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { PriceAlertButton } from "@/components/marketplace/PriceAlertButton";
import { StoreTrustChips } from "@/components/marketplace/StoreTrustChips";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const image = primaryProductImageUrl(product.images);
  const mediaType = mediaTypeFromCategory(product.category);
  const gameToken = product.tcg_id ? GAME_TOKENS[product.tcg_id as GameId] : null;
  const showNew = mounted && isNewProduct(product.created_at, Date.now());
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all duration-200 hover:border-primary/25 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        <Link href={`/marketplace/product/${product.id}`} className="block h-full w-full">
          <CardImage
            src={image}
            alt={product.name}
            fallbackLabel={product.name}
            mediaType={mediaType}
            fill
            listQuality
            className="object-contain p-3"
            sizes="(max-width:768px) 50vw, 25vw"
          />
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {showNew && <Badge variant="warning">Novo</Badge>}
          {outOfStock && <Badge variant="danger">Esgotado</Badge>}
        </div>

        <div
          className="absolute bottom-2 right-2 z-10 flex gap-1 opacity-100 transition-opacity duration-base md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <PriceAlertButton productId={product.id} product={product} size="sm" className="min-h-11 min-w-11 p-2.5" />
          <WishlistButton productId={product.id} product={product} size="sm" className="min-h-11 min-w-11 p-2.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <div className="flex min-h-5 flex-wrap items-center gap-2">
            {gameToken && (
              <p className="text-overline text-muted-foreground">
                {gameToken.name}
              </p>
            )}
            {product.condition && <Badge variant="secondary">{product.condition}</Badge>}
          </div>
          <Link
            href={`/marketplace/product/${product.id}`}
            className="line-clamp-2 text-body font-semibold leading-snug text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {product.name}
          </Link>
        </div>

        <p className="font-mono text-xl font-semibold tracking-tight text-foreground">
          {formatShopPrice(product.price_cents)}
        </p>

        {product.store_name && product.store_slug && (
          <div className="border-t border-border pt-3">
            <Link
              href={`/marketplace/loja/${product.store_slug}`}
              className="text-small font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {product.store_name}
            </Link>
            <StoreTrustChips
              compact
              verificationStatus={product.store_verification_status}
              averageRating={product.store_average_rating}
              reviewCount={product.store_review_count}
              acceptsPix={product.store_accepts_pix}
              acceptsCard={product.store_accepts_card}
            />
          </div>
        )}

        <div className="mt-auto pt-1">
          <Button
            type="button"
            size="sm"
            className="min-h-11 w-full"
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
