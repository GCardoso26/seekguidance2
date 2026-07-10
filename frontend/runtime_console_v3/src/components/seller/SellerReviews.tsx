"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReviewDistribution } from "@/components/reviews/ReviewDistribution";
import { ReviewStarsDisplay } from "@/components/reviews/ReviewStars";
import { ShopReviewCard, type ShopReview } from "@/components/reviews/ShopReviewCard";

type Props = {
  sellerId: string;
};

export function SellerReviews({ sellerId }: Props) {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["seller-review-summary", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/reviews/summary`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        total: number;
        average: number;
        distribution: Record<string, number>;
        positive_rate: number;
      }>;
    },
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ["seller-reviews", sellerId, page, ratingFilter],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: "10" });
      if (ratingFilter) qs.set("rating", String(ratingFilter));
      const res = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/reviews?${qs}`,
      );
      if (!res.ok) return { reviews: [], total: 0 };
      return res.json() as Promise<{ reviews: ShopReview[]; total: number }>;
    },
  });

  const reviews = listData?.reviews ?? [];
  const total = listData?.total ?? 0;
  const distNumeric: Record<number, number> = {};
  if (summary?.distribution) {
    for (const [k, v] of Object.entries(summary.distribution)) {
      distNumeric[Number(k)] = Number(v);
    }
  }

  return (
    <div className="space-y-6">
      {summary && summary.total > 0 && (
        <div className="surface-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-4xl font-bold text-primary">{summary.average.toFixed(1)}</span>
            <div>
              <ReviewStarsDisplay rating={summary.average} size="md" />
              <p className="text-sm text-muted-foreground">{summary.total} avaliações · {summary.positive_rate}% positivas</p>
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <ReviewDistribution distribution={distNumeric} total={summary.total} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setRatingFilter(null); setPage(1); }}
          className={`rounded-full px-3 py-1 text-xs ${ratingFilter === null ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Todas
        </button>
        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRatingFilter(r); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs ${ratingFilter === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {r} ★
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}
      {!isLoading && reviews.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">Nenhuma avaliação ainda.</p>
      )}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ShopReviewCard key={review.id} review={review} />
        ))}
      </div>

      {total > 10 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg bg-muted px-3 py-1 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">Página {page}</span>
          <button
            type="button"
            disabled={page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-muted px-3 py-1 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
