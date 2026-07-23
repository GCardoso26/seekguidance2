"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";

type CollectionPayload = {
  collection: {
    id: string;
    name: string;
    game?: string | null;
    description?: string | null;
    expansion_code?: string | null;
    slug?: string | null;
  };
  products: Array<{
    id: string;
    title_pt: string;
    category: string;
    subcategory: string;
    lifecycle?: string;
    product_family?: string | null;
  }>;
};

/**
 * Portal — página de coleção oficial do Product Knowledge Graph.
 */
export default function PortalCatalogCollectionPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-collection", slug],
    queryFn: async () => {
      const res = await fetch(`/api/product-catalog/collections/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("not_found");
      return res.json() as Promise<CollectionPayload>;
    },
    enabled: Boolean(slug),
  });

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/loja" className="text-sm text-muted-foreground hover:text-primary">
          ← Portal
        </Link>
        {isLoading && <p className="mt-6 text-muted-foreground">Carregando coleção…</p>}
        {isError && <p className="mt-6 text-destructive">Coleção não encontrada.</p>}
        {data && (
          <>
            <h1 className="mt-6 text-3xl font-bold tracking-tight">{data.collection.name}</h1>
            {data.collection.game ? (
              <p className="mt-2 text-sm text-muted-foreground">Jogo: {data.collection.game}</p>
            ) : null}
            {data.collection.expansion_code ? (
              <p className="text-sm text-muted-foreground">
                Expansão: {data.collection.expansion_code}
              </p>
            ) : null}
            {data.collection.description ? (
              <p className="mt-4 text-muted-foreground">{data.collection.description}</p>
            ) : null}
            <h2 className="mt-8 text-lg font-semibold">Todos os produtos desta coleção</h2>
            <ul className="mt-4 divide-y divide-border">
              {data.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{p.title_pt}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category} / {p.subcategory}
                      {p.product_family ? ` · ${p.product_family}` : ""}
                    </p>
                  </div>
                  {p.lifecycle ? (
                    <span className="shrink-0 rounded border border-border px-2 py-0.5 text-[10px] uppercase">
                      {p.lifecycle.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {!data.products.length ? (
              <p className="mt-4 text-sm text-muted-foreground">Nenhum produto vinculado ainda.</p>
            ) : null}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
