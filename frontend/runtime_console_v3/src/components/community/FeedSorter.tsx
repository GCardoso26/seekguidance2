"use client";

import type { PostSort, TopPeriod } from "@/types/post";
import { cn } from "@/lib/utils";

type Props = {
  sort: PostSort;
  period: TopPeriod;
  feed: "all" | "following";
  onSortChange: (sort: PostSort) => void;
  onPeriodChange: (period: TopPeriod) => void;
  onFeedChange: (feed: "all" | "following") => void;
};

const SORTS: { id: PostSort; label: string }[] = [
  { id: "hot", label: "Hot" },
  { id: "new", label: "Novos" },
  { id: "top", label: "Top" },
];

const PERIODS: { id: TopPeriod; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
  { id: "all", label: "Sempre" },
];

export function FeedSorter({ sort, period, feed, onSortChange, onPeriodChange, onFeedChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["all", "following"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFeedChange(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              feed === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
            )}
          >
            {f === "all" ? "Todos" : "Seguindo"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSortChange(s.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              sort === s.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sort === "top" && (
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                period === p.id ? "bg-muted/60 text-foreground" : "text-muted-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
