"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CardImage } from "@/components/ui/CardImage";
import { mediaTypeFromCategory } from "@/lib/assets";

type RelatedItem = {
  product_id: string;
  title_pt: string;
  category: string;
  subcategory: string;
  relation_type: string;
  confidence: number;
  image_url?: string | null;
};

/**
 * Official related products — consumes Product Relationship Engine.
 * No AI. Marketplace UX only.
 */
export function OfficialRelatedProducts({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["product-relationships", productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/product-catalog/products/${encodeURIComponent(productId)}/relationships?limit=24`,
      );
      if (!res.ok) return { items: [] as RelatedItem[] };
      return res.json() as Promise<{ items: RelatedItem[] }>;
    },
    enabled: Boolean(productId),
  });

  const items = data?.items ?? [];
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando relacionados oficiais…</p>;
  }
  if (!items.length) return null;

  return (
    <section className="mt-8" data-testid="official-related-products">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Produtos relacionados oficiais</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Relacionamentos oficiais do catálogo (contains, accessory_for, recommended_with…). Sem
        recomendações por IA.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <li key={`${item.product_id}-${item.relation_type}`}>
            <Link
              href={`/marketplace/produtos?q=${encodeURIComponent(item.title_pt)}`}
              className="block rounded-lg border border-border p-2 transition hover:bg-muted/40"
            >
              <span className="relative mb-2 block aspect-square overflow-hidden rounded bg-muted/30">
                {item.image_url ? (
                  <CardImage
                    src={item.image_url}
                    alt={item.title_pt}
                    fallbackLabel={item.title_pt.slice(0, 8)}
                    mediaType={mediaTypeFromCategory(item.category)}
                    fill
                    listQuality
                    className="object-contain"
                    sizes="120px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    —
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-xs font-medium">{item.title_pt}</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">
                {item.relation_type.replace(/_/g, " ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
