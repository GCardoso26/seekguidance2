"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
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
        <Link href="/marketplace" className="text-sm text-luxury-mist">← Marketplace</Link>
        {isLoading && <p className="mt-6 text-luxury-mist">Carregando…</p>}
        {store && (
          <>
            <h1 className="mt-4 text-2xl font-bold">{String(store.name)}</h1>
            {store.description && <p className="mt-2 text-luxury-mist">{String(store.description)}</p>}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {products.length === 0 && (
              <p className="mt-8 text-center text-luxury-mist">Esta loja ainda não publicou produtos.</p>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
