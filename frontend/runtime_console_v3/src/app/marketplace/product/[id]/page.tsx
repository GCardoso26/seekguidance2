"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { formatShopPrice, addProductToCart, type ShopProduct } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";

export default function ProductDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/products/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json() as Promise<{ product: ShopProduct }>;
    },
    enabled: Boolean(id),
  });

  const product = data?.product;
  const image = product?.images?.[0];

  async function buyNow() {
    if (!product) return;
    const result = await addProductToCart(product.id);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      window.location.href = "/marketplace/checkout";
      return;
    }
    if (result.needsLogin) {
      showToast("Faça login para comprar", "error");
      window.location.href = `/login?next=${encodeURIComponent(`/marketplace/product/${product.id}`)}`;
      return;
    }
    showToast(result.message, "error");
  }

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/marketplace" className="text-sm text-luxury-mist hover:text-luxury-gold">
          ← Marketplace
        </Link>
        {isLoading && <p className="mt-6 text-luxury-mist">Carregando…</p>}
        {product && (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {image ? (
                <Image src={image} alt={product.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-luxury-mist">Sem imagem</div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {product.store_slug && (
                <Link href={`/marketplace/loja/${product.store_slug}`} className="mt-2 inline-block text-sm text-luxury-mist hover:underline">
                  {product.store_name}
                </Link>
              )}
              <p className="mt-4 font-mono text-2xl text-luxury-gold">{formatShopPrice(product.price_cents)}</p>
              {product.description && <p className="mt-4 text-luxury-mist">{product.description}</p>}
              <p className="mt-2 text-sm text-luxury-mist">Estoque: {product.stock ?? 0}</p>
              <button type="button" onClick={buyNow} className="mt-6 rounded-lg bg-luxury-gold px-6 py-3 font-semibold text-luxury-onyx">
                Comprar agora
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
