type Props = {
  rating?: number;
  count?: number;
  className?: string;
};

export function StoreRatingBadge({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-success ${className}`}
    >
      Loja Top Rated
    </span>
  );
}

export function StoreRatingInline({ rating, count }: Props) {
  if (!rating && !count) return null;
  return (
    <span className="text-sm text-muted-foreground">
      ★ {Number(rating ?? 0).toFixed(1)} ({count ?? 0})
    </span>
  );
}
