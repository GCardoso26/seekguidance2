"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { StoreReviews } from "@/components/reviews/StoreReviews";
import { StoreRatingBadge, StoreRatingInline } from "@/components/store/StoreRatingBadge";
import { StoreReputationPanel } from "@/components/store/StoreReputationPanel";
import { ProBadge } from "@/components/store/ProBadge";
import type { ShopProduct } from "@/lib/marketplace-shop";

export default function StorePage() {
  const params = useParams();
  const slug = String(params.slug ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["shop-store", slug],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/slug/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Loja não encontrada");
      return res.json() as Promise<{ store: Record<string, unknown>; products: ShopProduct[] }>;
    },
    enabled: Boolean(slug),
  });

  const store = data?.store;
  const products = data?.products ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/marketplace/produtos" className="text-sm text-muted-foreground">← Produtos selados</Link>
        {isLoading && <p className="mt-6 text-muted-foreground">Carregando…</p>}
        {store && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{String(store.name)}</h1>
              <ProBadge plan={String(store.subscription_plan ?? "free")} />
              <StoreRatingInline rating={Number(store.average_rating)} count={Number(store.review_count)} />
            </div>
            {Number(store.average_rating) >= 4.8 && Number(store.review_count) >= 50 && (
              <StoreRatingBadge className="mt-2" />
            )}
            {store.description && <p className="mt-2 text-muted-foreground">{String(store.description)}</p>}
            <StoreReputationPanel slug={slug} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {products.length === 0 && (
              <p className="mt-8 text-center text-muted-foreground">Esta loja ainda não publicou produtos.</p>
            )}
            <StoreReviews storeId={String(store.id)} />
          </>
        )}
      </div>
    </MobileLayout>
  );
}
