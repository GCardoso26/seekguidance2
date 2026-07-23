"use client";

import { CardImage } from "@/components/ui/CardImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaTypeFromCategory, primaryProductImageUrl } from "@/lib/assets";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { pdvCanAddToCart, pdvStockLabel, type PdvProduct } from "@/types/pdv";
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
          placeholder="Buscar por nome, SKU ou código de barras…"
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
          const isLocal = p.source === "local";
          const canAdd = pdvCanAddToCart(p.stock, 0);
          return (
            <li
              key={`${p.source ?? "official"}-${p.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              data-testid={`pdv-search-result-${p.id}`}
              data-source={p.source ?? "official"}
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
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        isLocal
                          ? "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      }
                      data-testid={isLocal ? "pdv-badge-local" : "pdv-badge-official"}
                    >
                      {isLocal ? "LOCAL" : "OFICIAL"}
                    </span>
                    <p className="truncate font-medium">{p.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatShopPrice(p.price_cents)}
                    {p.sku ? ` · SKU ${p.sku}` : ""}
                    {p.barcode ? ` · ${p.barcode}` : ""} · estoque {pdvStockLabel(p.stock)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!canAdd}
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
