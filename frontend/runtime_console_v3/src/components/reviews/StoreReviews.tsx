"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReviewDistribution } from "@/components/reviews/ReviewDistribution";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewStarsDisplay } from "@/components/reviews/ReviewStars";
import { StoreRatingBadge } from "@/components/store/StoreRatingBadge";
import type { ShopReview } from "@/components/reviews/ShopReviewCard";

type Props = {
  storeId: string;
};

export function StoreReviews({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("recent");

  const { data: stats } = useQuery({
    queryKey: ["shop-review-stats", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/reviews/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        average_rating: number;
        total_reviews: number;
        distribution: Record<number, number>;
        top_rated: boolean;
      }>;
    },
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ["shop-reviews", storeId, page, filter],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: "10", filter });
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/reviews?${qs}`,
      );
      if (!res.ok) return { reviews: [], total: 0 };
      return res.json() as Promise<{ reviews: ShopReview[]; total: number }>;
    },
  });

  if (!stats) return null;

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Avaliações</h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-luxury-gold">{stats.average_rating.toFixed(1)}</span>
            <ReviewStarsDisplay rating={stats.average_rating} size="md" />
            <span className="text-sm text-luxury-mist">({stats.total_reviews} avaliações)</span>
          </div>
          {stats.top_rated && <StoreRatingBadge className="mt-2" />}
        </div>
        <div className="w-full max-w-xs">
          <ReviewDistribution distribution={stats.distribution} total={stats.total_reviews} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { id: "recent", label: "Recentes" },
          { id: "photos", label: "Com fotos" },
          { id: "response", label: "Com resposta" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setFilter(f.id); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs ${filter === f.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-luxury-mist">Carregando…</p>
      ) : (
        <ReviewList
          reviews={listData?.reviews ?? []}
          page={page}
          total={listData?.total ?? 0}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
