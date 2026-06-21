import { ShopReviewCard, type ShopReview } from "@/components/reviews/ShopReviewCard";

type Props = {
  reviews: ShopReview[];
  page: number;
  total: number;
  limit?: number;
  onPageChange?: (page: number) => void;
};

export function ReviewList({ reviews, page, total, limit = 10, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (reviews.length === 0) {
    return <p className="text-sm text-luxury-mist">Nenhuma avaliação ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ShopReviewCard key={r.id} review={r} />
      ))}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2 py-1 text-sm text-luxury-mist">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
