"use client";

import Link from "next/link";
import Image from "next/image";
import { formatShopPrice, type ShopProduct } from "@/lib/marketplace-shop";

type Props = {
  product: ShopProduct;
  onAdd?: (productId: string) => void;
};

export function ProductCard({ product, onAdd }: Props) {
  const image = product.images?.[0];
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <Link href={`/marketplace/product/${product.id}`} className="relative aspect-square bg-black/30">
        {image ? (
          <Image src={image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-luxury-mist">Sem imagem</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/marketplace/product/${product.id}`} className="font-semibold text-white hover:text-luxury-gold">
          {product.name}
        </Link>
        {product.store_name && product.store_slug && (
          <Link href={`/marketplace/loja/${product.store_slug}`} className="text-xs text-luxury-mist hover:underline">
            {product.store_name}
          </Link>
        )}
        <p className="font-mono text-lg text-luxury-gold">{formatShopPrice(product.price_cents)}</p>
        <button
          type="button"
          onClick={() => onAdd?.(product.id)}
          className="mt-auto rounded-lg bg-luxury-gold px-3 py-2 text-sm font-semibold text-luxury-onyx"
        >
          Adicionar
        </button>
      </div>
    </article>
  );
}
