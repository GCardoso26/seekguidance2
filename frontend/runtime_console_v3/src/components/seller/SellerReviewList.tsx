import type { SellerReview } from "@/types/seller";

interface Props {
  reviews: SellerReview[];
  total: number;
}

export function SellerReviewList({ reviews, total }: Props) {
  if (reviews.length === 0) {
    return <p className="py-8 text-center text-luxury-mist">Nenhuma avaliação ainda.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-luxury-mist">{total} avaliações</p>
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            <span className="text-luxury-mist">
              {review.reviewer_name ?? "Comprador"} ·{" "}
              {new Date(review.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
          {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
