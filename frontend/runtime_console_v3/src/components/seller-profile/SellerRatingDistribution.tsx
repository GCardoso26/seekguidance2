import type { SellerRatingSummary } from "@/lib/seller-analytics-query";

type Props = {
  summary: SellerRatingSummary;
};

export function SellerRatingDistribution({ summary }: Props) {
  const total = summary.total_reviews || 0;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Distribuição de notas</h3>
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = summary.distribution[String(stars)] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={stars} className="group flex items-center gap-2">
            <span className="w-6 text-xs text-muted-foreground">{stars}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="w-8 text-right text-xs text-muted-foreground"
              title={`${count} avaliações`}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
