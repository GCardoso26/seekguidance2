"use client";

import Link from "next/link";
import Image from "next/image";
import { formatShopPrice, type ShopProduct } from "@/lib/marketplace-shop";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { PriceAlertButton } from "@/components/marketplace/PriceAlertButton";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type Props = {
  product: ShopProduct;
  onAdd?: (productId: string) => void;
};

function isNewProduct(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return created >= weekAgo;
}

export function ProductCard({ product, onAdd }: Props) {
  const image = product.images?.[0];
  const gameToken = product.tcg_id ? GAME_TOKENS[product.tcg_id as GameId] : null;
  const showNew = isNewProduct(product.created_at);
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="relative aspect-square bg-black/30">
        <Link href={`/marketplace/product/${product.id}`} className="block h-full w-full">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" unoptimized sizes="(max-width:768px) 50vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-luxury-mist">Sem imagem</div>
          )}
        </Link>
        {showNew && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase text-luxury-onyx">
            Novo
          </span>
        )}
        {outOfStock && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            Esgotado
          </span>
        )}
        <div className="absolute bottom-2 right-2 z-10 flex gap-1">
          <PriceAlertButton productId={product.id} product={product} size="sm" />
          <WishlistButton productId={product.id} product={product} size="sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/marketplace/product/${product.id}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-luxury-gold">
          {product.name}
        </Link>
        {gameToken && <span className="text-[10px] uppercase tracking-wide text-luxury-mist">{gameToken.name}</span>}
        {product.store_name && product.store_slug && (
          <Link href={`/marketplace/loja/${product.store_slug}`} className="text-xs text-luxury-mist hover:underline">
            {product.store_name}
          </Link>
        )}
        {product.condition && (
          <span className="text-[10px] font-medium text-luxury-gold">{product.condition}</span>
        )}
        <p className="font-mono text-base text-luxury-gold">{formatShopPrice(product.price_cents)}</p>
        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd?.(product.id);
          }}
          className="mt-auto rounded-lg bg-luxury-gold px-3 py-2 text-sm font-semibold text-luxury-onyx disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? "Indisponível" : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
