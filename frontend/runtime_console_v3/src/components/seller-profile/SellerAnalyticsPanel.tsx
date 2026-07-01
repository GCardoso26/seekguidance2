"use client";

import dynamic from "next/dynamic";
import { Star } from "lucide-react";
import { useSellerAnalytics } from "@/hooks/useSellerAnalytics";
import { SellerBadgesRow } from "./SellerBadgesRow";
import { SellerRatingDistribution } from "./SellerRatingDistribution";
import { SellerStatsGrid } from "./SellerStatsGrid";
import { SellerTopGames } from "./SellerTopGames";
import type { SellerProductFilters } from "@/lib/seller-profile-query";

const SellerActivitySparkline = dynamic(
  () => import("./SellerActivitySparkline").then((m) => m.SellerActivitySparkline),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-lg bg-muted" /> },
);

type Props = {
  username: string;
  onFilterGame?: (filters: Partial<SellerProductFilters>) => void;
  selectedGame?: string;
};

function AnalyticsSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />;
}

export function SellerAnalyticsPanel({ username, onFilterGame, selectedGame }: Props) {
  const { data, isLoading, isError } = useSellerAnalytics(username);

  if (process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS === "false") return null;
  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) return null;

  const { public_metrics, rating_summary, top_games, recent_activity, badges, activity_sparkline } =
    data;

  return (
    <section
      className="mt-6 space-y-6 rounded-2xl border border-border/50 bg-card/50 p-4 md:p-6"
      data-testid="seller-analytics-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Confiança do vendedor</p>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-2xl font-bold">{rating_summary.average_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({rating_summary.total_reviews} avaliações)
            </span>
          </div>
        </div>
        {public_metrics.member_since && (
          <p className="text-xs text-muted-foreground">
            Membro desde{" "}
            {new Date(public_metrics.member_since).toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      <SellerStatsGrid metrics={public_metrics} activity={recent_activity} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <SellerBadgesRow badges={badges} />
          <SellerTopGames
            games={top_games}
            selectedGame={selectedGame}
            onSelectGame={(slug) => onFilterGame?.({ gameId: slug })}
          />
          <div>
            <h3 className="mb-2 text-sm font-semibold">Atividade (90 dias)</h3>
            <SellerActivitySparkline data={activity_sparkline ?? []} />
          </div>
        </div>
        <SellerRatingDistribution summary={rating_summary} />
      </div>
    </section>
  );
}
