"use client";

import { StarRating } from "@/components/ui/StarRating";
import type { SellerReview } from "@/hooks/useSellerReviews";

type Props = {
  review: SellerReview;
};

export function ReviewCard({ review }: Props) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString("pt-BR")
    : null;

  return (
    <article className="rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{review.reviewer_name}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            {review.is_verified_purchase && (
              <span className="text-xs text-success">Compra verificada</span>
            )}
          </div>
        </div>
        {date && <time className="text-xs text-muted-foreground">{date}</time>}
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
      )}
      {review.store_response && (
        <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Resposta do vendedor</p>
          <p className="mt-1">{review.store_response}</p>
        </div>
      )}
    </article>
  );
}
