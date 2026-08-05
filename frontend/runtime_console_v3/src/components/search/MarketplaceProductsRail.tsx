"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format-currency";
import { offerCountLabel } from "@/features/search/conversion";
import type { PurchaseIntent } from "@/features/search/conversion";

type ProductRow = {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  image_url?: string | null;
  lowest_price_cents?: number | null;
  price_cents?: number | null;
  currency?: string;
  listing_count?: number;
  stock?: number;
  quantity?: number;
};

type Props = {
  query: string;
  intent: PurchaseIntent;
  enabled?: boolean;
};

async function fetchProducts(q: string, intent: PurchaseIntent): Promise<ProductRow[]> {
  const params = new URLSearchParams({ q, limit: "8", page: "1" });
  if (intent === "accessory") params.set("category", "accessory");
  if (intent === "sealed") params.set("category", "booster");
  const res = await fetch(`/api/marketplace/products?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: ProductRow[] };
  return data.products ?? [];
}

/** Painel secundário de selados/acessórios na busca de compra. */
export function MarketplaceProductsRail({ query, intent, enabled = true }: Props) {
  const q = query.trim();
  const show =
    enabled &&
    q.length >= 2 &&
    (intent === "accessory" || intent === "sealed" || intent === "generic");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["marketplace-products-rail", q, intent],
    queryFn: () => fetchProducts(q, intent),
    enabled: show,
    staleTime: 60_000,
  });

  if (!show) return null;

  const href =
    intent === "accessory"
      ? `/marketplace/produtos?q=${encodeURIComponent(q)}&category=accessory`
      : intent === "sealed"
        ? `/marketplace/produtos?q=${encodeURIComponent(q)}&category=booster`
        : `/marketplace/produtos?q=${encodeURIComponent(q)}`;

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card/30 p-4"
      data-testid="marketplace-products-rail"
      aria-label="Produtos do marketplace"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {intent === "accessory"
            ? "Acessórios no marketplace"
            : intent === "sealed"
              ? "Selados no marketplace"
              : "Marketplace"}
        </h2>
        <Link href={href} className="text-xs text-primary hover:underline">
          Ver todos →
        </Link>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Buscando produtos…</p>
      )}

      {!isLoading && products.length === 0 && (
        <p className="text-sm text-muted-foreground" data-testid="marketplace-rail-empty">
          Sem ofertas de produtos para esta busca. Catálogo e lista de interesse abaixo.
        </p>
      )}

      {products.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const name = p.name || p.title || "Produto";
            const cents = p.lowest_price_cents ?? p.price_cents;
            const offers = p.listing_count ?? (cents != null ? 1 : 0);
            const stock = p.stock ?? p.quantity;
            return (
              <li key={p.id}>
                <Link
                  href={`/marketplace/product/${encodeURIComponent(p.id)}`}
                  className="flex gap-3 rounded-lg border border-border bg-background p-2 transition hover:border-primary/40"
                  data-testid="marketplace-rail-item"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/40">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{offerCountLabel(offers)}</p>
                    {stock != null && stock > 0 && (
                      <p className="text-xs text-muted-foreground">{stock} em estoque</p>
                    )}
                    {cents != null && (
                      <p className="text-sm font-semibold">
                        {formatCurrency(cents / 100, p.currency || "BRL")}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
