import { ReviewStarsDisplay } from "@/components/reviews/ReviewStars";
import { formatRelativeTime } from "@/lib/relative-time";

export type ShopReview = {
  id: string;
  rating: number;
  comment?: string | null;
  photos?: string[];
  reviewer_name?: string | null;
  created_at?: string;
  store_response?: string | null;
  store_responded_at?: string | null;
  edited_at?: string | null;
};

type Props = {
  review: ShopReview;
  verified?: boolean;
};

export function ShopReviewCard({ review, verified = true }: Props) {
  const photos = review.photos ?? [];
  const name = review.reviewer_name?.split(" ")[0] ?? "Comprador";

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{name}</p>
          <ReviewStarsDisplay rating={review.rating} />
        </div>
        <div className="text-right text-xs text-luxury-mist">
          {review.created_at && formatRelativeTime(review.created_at)}
          {review.edited_at && (
            <p className="mt-1 text-amber-400">
              Editado em {new Date(review.edited_at).toLocaleDateString("pt-BR")}
            </p>
          )}
          {verified && <p className="mt-1 text-emerald-400">Compra verificada</p>}
        </div>
      </div>
      {review.comment && <p className="mt-3 text-sm text-luxury-mist">{review.comment}</p>}
      {photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
      {review.store_response && (
        <div className="mt-3 rounded-lg border border-luxury-gold/20 bg-luxury-gold/5 p-3 text-sm">
          <p className="text-xs font-semibold text-luxury-gold">Resposta da loja</p>
          <p className="mt-1 text-luxury-mist">{review.store_response}</p>
        </div>
      )}
    </article>
  );
}
