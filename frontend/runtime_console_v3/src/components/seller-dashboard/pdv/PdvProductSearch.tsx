"use client";

import { CardImage } from "@/components/ui/CardImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaTypeFromCategory, primaryProductImageUrl } from "@/lib/assets";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { PdvProduct } from "@/types/pdv";
import { useState } from "react";

type Props = {
  products: PdvProduct[];
  isLoading?: boolean;
  onAdd: (product: PdvProduct) => void;
  onSearch: (q: string) => void;
};

export function PdvProductSearch({ products, isLoading, onAdd, onSearch }: Props) {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-3" data-testid="pdv-product-search">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(query);
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou SKU…"
          className="max-w-md border-border bg-foreground/30"
          data-testid="pdv-text-search-input"
        />
        <Button type="submit" variant="outline" disabled={query.trim().length < 2}>
          Buscar
        </Button>
      </form>

      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {isLoading && <li className="text-sm text-muted-foreground">Buscando…</li>}
        {!isLoading && products.length === 0 && (
          <li className="text-sm text-muted-foreground" data-testid="pdv-search-empty">
            Nenhum produto. Digite ao menos 2 caracteres.
          </li>
        )}
        {products.map((p) => {
          const thumb = primaryProductImageUrl(p.images);
          const mediaType = mediaTypeFromCategory(p.category);
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              data-testid={`pdv-search-result-${p.id}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted/40">
                  <CardImage
                    src={thumb}
                    alt={p.name}
                    fallbackLabel={p.name.slice(0, 12)}
                    mediaType={mediaType}
                    fill
                    listQuality
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShopPrice(p.price_cents)}
                    {p.sku ? ` · SKU ${p.sku}` : ""} · estoque {p.stock}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={p.stock <= 0}
                onClick={() => onAdd(p)}
                data-testid={`pdv-add-product-${p.id}`}
              >
                +
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
