"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { WishlistButton } from "@/components/marketplace/WishlistButton";
import { PriceAlertButton } from "@/components/marketplace/PriceAlertButton";
import { OfficialRelatedProducts } from "@/components/marketplace/OfficialRelatedProducts";
import { ProductKnowledgePanel } from "@/components/marketplace/ProductKnowledgePanel";
import { formatShopPrice, addProductToCart, type ShopProduct } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";
import { isUnusableImageSrc } from "@/lib/format-currency";
import { StoreTrustChips } from "@/components/marketplace/StoreTrustChips";
import {
  PdpLegalAtfLine,
  PdpPurchaseAssurance,
  PdpShippingCepField,
} from "@/components/cards/PdpTrustExtras";

export default function ProductDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/products/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Produto não encontrado");
      return res.json() as Promise<{ product: ShopProduct & { master_product_id?: string | null; master_variant_id?: string | null } }>;
    },
    enabled: Boolean(id),
  });

  const product = data?.product;
  const gallery = useMemo(
    () =>
      (product?.images ?? []).filter(
        (src): src is string => Boolean(src) && !isUnusableImageSrc(src),
      ),
    [product?.images],
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const image = gallery[Math.min(activeIdx, Math.max(gallery.length - 1, 0))] ?? null;
  const relatedCatalogId =
    (product as { master_product_id?: string | null } | undefined)?.master_product_id ??
    undefined;

  async function buyNow() {
    if (!product) return;
    const result = await addProductToCart(product.id);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      window.location.href = "/checkout";
      return;
    }
    if (result.needsLogin) {
      showToast("Faça login para comprar", "error");
      window.location.href = `/entrar?next=${encodeURIComponent(`/marketplace/product/${product.id}`)}`;
      return;
    }
    showToast(result.message, "error");
  }

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/marketplace/produtos" className="text-sm text-muted-foreground hover:text-primary">
          ← Marketplace
        </Link>
        {isLoading && <p className="mt-6 text-muted-foreground">Carregando…</p>}
        {product && (
          <>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-foreground/30">
                {image ? (
                  <Image src={image} alt={product.name} fill className="object-contain bg-black/20" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Sem imagem</div>
                )}
                <div className="absolute right-3 top-3 flex gap-2">
                  <PriceAlertButton productId={product.id} product={product} />
                  <WishlistButton productId={product.id} product={product} />
                </div>
              </div>
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
                        idx === activeIdx ? "border-primary ring-1 ring-primary" : "border-border"
                      }`}
                      aria-label={`Foto ${idx + 1}`}
                    >
                      <Image src={src} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
              <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
              {product.store_slug && (
                <div className="mt-2 space-y-1.5">
                  <Link href={`/marketplace/loja/${product.store_slug}`} className="inline-block text-sm text-muted-foreground hover:underline">
                    {product.store_name}
                  </Link>
                  <StoreTrustChips
                    verificationStatus={product.store_verification_status}
                    averageRating={product.store_average_rating}
                    reviewCount={product.store_review_count}
                    acceptsPix={product.store_accepts_pix}
                    acceptsCard={product.store_accepts_card}
                  />
                </div>
              )}
              <p className="mt-4 font-mono text-2xl text-primary">{formatShopPrice(product.price_cents)}</p>
              <PdpLegalAtfLine className="mt-2" />
              {product.description && <p className="mt-4 text-muted-foreground">{product.description}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                Estoque: {product.stock ?? 0}
                {(product.stock ?? 0) > 0 ? " · pronto para envio" : ""}
              </p>
              <div className="mt-4 space-y-3">
                <PdpShippingCepField />
                <PdpPurchaseAssurance />
              </div>
              <button
                type="button"
                onClick={buyNow}
                disabled={(product.stock ?? 0) <= 0}
                className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {(product.stock ?? 0) > 0 ? "Comprar agora" : "Sem estoque"}
              </button>
            </div>
          </div>
          {relatedCatalogId ? (
            <>
              <ProductKnowledgePanel productId={relatedCatalogId} />
              <OfficialRelatedProducts productId={relatedCatalogId} />
            </>
          ) : (
            <ProductKnowledgePanel unbound />
          )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
