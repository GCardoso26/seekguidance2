"use client";

import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductEmpty } from "@/components/marketplace/ProductEmpty";
import { ProductSkeleton } from "@/components/marketplace/ProductSkeleton";
import { Button } from "@/components/ui/button";
import type { ShopProduct } from "@/lib/marketplace-shop";

export interface ProductGridProps {
  products: ShopProduct[];
  isLoading?: boolean;
  total?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
  onAddToCart?: (productId: string) => void;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading,
  total = 0,
  hasMore,
  onLoadMore,
  isFetchingMore,
  onAddToCart,
  onClearFilters,
}: ProductGridProps) {
  if (isLoading && products.length === 0) {
    return <ProductSkeleton />;
  }

  if (!isLoading && products.length === 0) {
    return <ProductEmpty onClear={onClearFilters} />;
  }

  return (
    <div className="space-y-6" data-testid="marketplace-product-grid">
      <p className="text-sm text-luxury-mist" aria-live="polite">
        {total.toLocaleString("pt-BR")} produto{total === 1 ? "" : "s"}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            loading={isFetchingMore}
            className="border-white/20"
          >
            Carregar mais
          </Button>
        </div>
      )}

      {isFetchingMore && products.length > 0 && <ProductSkeleton count={4} />}
    </div>
  );
}
