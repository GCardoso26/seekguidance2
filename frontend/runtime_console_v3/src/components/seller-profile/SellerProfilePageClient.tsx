"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SellerProfileHeader } from "@/components/seller-profile/SellerProfileHeader";
import { SellerProfileStats } from "@/components/seller-profile/SellerProfileStats";
import { SellerAnalyticsPanel } from "@/components/seller-profile/SellerAnalyticsPanel";
import { SellerProductFilters } from "@/components/seller-profile/SellerProductFilters";
import { SellerProductGrid } from "@/components/seller-profile/SellerProductGrid";
import { SellerReviews } from "@/components/seller-profile/SellerReviews";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import type { MarketplaceSellerProfile, SellerProductFilters as Filters } from "@/lib/seller-profile-query";

type Tab = "products" | "reviews";

type Props = {
  seller: MarketplaceSellerProfile;
};

export function SellerProfilePageClient({ seller }: Props) {
  const [filters, setFilters] = useState<Filters>({});
  const [tab, setTab] = useState<Tab>("products");

  const swipe = useSwipeGesture({
    onSwipeLeft: () => setTab((t) => (t === "products" ? "reviews" : t)),
    onSwipeRight: () => setTab((t) => (t === "reviews" ? "products" : t)),
  });

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8" {...swipe}>
        <SellerProfileHeader seller={seller} />
        <SellerProfileStats seller={seller} />
        <SellerAnalyticsPanel
          username={seller.username}
          selectedGame={filters.gameId}
          onFilterGame={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        />

        <div className="mt-6 flex gap-2 border-b border-border/50">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "products"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Produtos
          </button>
          {process.env.NEXT_PUBLIC_FEATURE_REVIEWS !== "false" && (
            <button
              type="button"
              onClick={() => setTab("reviews")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === "reviews"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Avaliações
            </button>
          )}
        </div>

        {tab === "products" ? (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <SellerProductFilters onChange={setFilters} />
            </div>
            <main className="lg:col-span-3">
              <SellerProductGrid username={seller.username} filters={filters} />
            </main>
          </div>
        ) : (
          <div className="mt-8">
            <SellerReviews username={seller.username} />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
