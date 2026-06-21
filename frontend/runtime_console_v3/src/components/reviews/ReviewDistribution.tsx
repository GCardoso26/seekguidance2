type Props = {
  distribution: Record<number, number>;
  total: number;
};

export function ReviewDistribution({ distribution, total }: Props) {
  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-luxury-mist">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-luxury-gold" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-luxury-mist">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
