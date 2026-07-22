"use client";

import Link from "next/link";
import { WishlistPage } from "@/components/marketplace/WishlistPage";

/**
 * Wishlist integrada à Collection — reutiliza UI/hooks existentes (Marketplace API).
 */
export function CollectionWishlistPanel() {
  return (
    <section className="space-y-4" data-testid="collection-wishlist-panel">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Wishlist na coleção</h2>
          <p className="mt-1 text-small text-muted-foreground">
            Preço atual, alertas e compra — mesma Wishlist API, agora no hub da coleção.
          </p>
        </div>
        <Link href="/wishlist/alerts" className="text-small text-primary hover:underline">
          Alertas de preço
        </Link>
      </div>
      <WishlistPage />
    </section>
  );
}
