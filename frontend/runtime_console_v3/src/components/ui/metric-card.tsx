/**
 * MetricCard — Design System v3 (marketplace / Top Movers)
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function MetricCard({ label, value, hint, trend = "neutral", className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col gap-1 rounded-xl border border-border p-4",
        className,
      )}
    >
      <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-h3 font-semibold tabular-nums text-foreground",
          trend === "up" && "text-success",
          trend === "down" && "text-danger",
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-small text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
