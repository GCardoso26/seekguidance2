"use client";

import { ProductCard } from "@/components/marketplace/ProductCard";
import { SHOP_CATEGORIES, type ShopProduct } from "@/lib/marketplace-shop";

type Props = {
  products: ShopProduct[];
  category: string;
  search: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
};

export function ProductGrid({
  products,
  category,
  search,
  onCategoryChange,
  onSearchChange,
  onAddToCart,
  isLoading,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-luxury-mist">Buscar</label>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nome do produto…"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-luxury-mist">Categoria</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className={`rounded-full px-3 py-1 text-xs ${!category ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"}`}
            >
              Todas
            </button>
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategoryChange(c.id)}
                className={`rounded-full px-3 py-1 text-xs ${category === c.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <div>
        {isLoading && <p className="text-luxury-mist">Carregando produtos…</p>}
        {!isLoading && products.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-luxury-mist">
            Nenhum produto encontrado.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAddToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}
