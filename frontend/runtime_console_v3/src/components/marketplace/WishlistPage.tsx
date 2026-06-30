"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useRemoveFromWishlist, useWishlist } from "@/hooks/useWishlist";
import { addProductToCart } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const remove = useRemoveFromWishlist();
  const queryClient = useQueryClient();
  const items = data?.items ?? [];

  async function handleAddToCart(productId: string) {
    const result = await addProductToCart(productId);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      showToast("Produto adicionado ao carrinho", "success");
      return;
    }
    if (result.needsLogin) {
      window.location.href = `/entrar?next=${encodeURIComponent("/wishlist")}`;
      return;
    }
    showToast(result.message, "error");
  }

  if (isLoading) {
    return <p className="text-sm text-luxury-mist">Carregando wishlist…</p>;
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-white/20 p-10 text-center"
        data-testid="wishlist-empty"
      >
        <p className="text-lg font-semibold text-luxury-frost">Sua wishlist está vazia</p>
        <p className="mt-2 text-sm text-luxury-mist">
          Salve produtos no marketplace para acompanhar depois.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-block rounded-lg bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-onyx"
        >
          Explorar marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="wishlist-page-content">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-luxury-mist">
          {items.length} produto{items.length === 1 ? "" : "s"} salvos
        </p>
        <Link
          href="/wishlist/alerts"
          className="text-sm text-luxury-gold hover:underline"
          data-testid="wishlist-alerts-link"
        >
          Alertas de preço →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.product_id} className="flex flex-col gap-2" data-testid={`wishlist-item-${item.product_id}`}>
            <ProductCard product={item.product} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold/90"
                onClick={() => void handleAddToCart(item.product_id)}
                data-testid={`wishlist-add-cart-${item.product_id}`}
              >
                Adicionar ao carrinho
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20"
                disabled={remove.isPending}
                onClick={() => void remove.mutateAsync(item.product_id)}
                data-testid={`wishlist-remove-${item.product_id}`}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
