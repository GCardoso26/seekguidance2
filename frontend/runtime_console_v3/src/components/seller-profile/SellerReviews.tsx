"use client";

import { useState } from "react";
import { useSellerReviews } from "@/hooks/useSellerReviews";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";

type Props = {
  username: string;
  isOwner?: boolean;
};

function ReviewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-lg bg-muted" />
      <div className="h-20 rounded-lg bg-muted" />
    </div>
  );
}

export function SellerReviews({ username, isOwner }: Props) {
  const [sort, setSort] = useState<"newest" | "highest" | "lowest" | "helpful">("newest");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { data, isLoading } = useSellerReviews(username, { sort, verifiedOnly });

  if (process.env.NEXT_PUBLIC_FEATURE_REVIEWS === "false") return null;
  if (isLoading || !data) return <ReviewsSkeleton />;

  const { reviews, rating_summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-3">
        <div className="text-center">
          <div className="text-4xl font-bold">{rating_summary.average.toFixed(1)}</div>
          <StarRating rating={rating_summary.average} size="lg" />
          <p className="mt-1 text-sm text-muted-foreground">
            {rating_summary.total} avaliações
          </p>
        </div>
        <div className="space-y-1 md:col-span-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rating_summary.distribution[String(stars)] || 0;
            const percentage =
              rating_summary.total > 0 ? (count / rating_summary.total) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="w-8 text-sm">{stars}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-sm text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded border px-2 py-1 text-sm"
          aria-label="Ordenar avaliações"
        >
          <option value="newest">Mais recentes</option>
          <option value="highest">Maior nota</option>
          <option value="lowest">Menor nota</option>
          <option value="helpful">Mais úteis</option>
        </select>
        <label className="flex cursor-pointer items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded"
          />
          Apenas compras verificadas
        </label>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
          title="Nenhuma avaliação ainda"
          description="Seja o primeiro a avaliar este vendedor após uma compra entregue."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {!isOwner && <ReviewForm sellerUsername={username} />}
    </div>
  );
}
