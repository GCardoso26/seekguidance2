"use client";

import { useMemo, useState } from "react";
import type { CollectionValueSeriesPoint } from "@/lib/collection-v2";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "90d" | "1y";

type Props = {
  series7d: CollectionValueSeriesPoint[];
  series30d: CollectionValueSeriesPoint[];
  series90d: CollectionValueSeriesPoint[];
  series1y: CollectionValueSeriesPoint[];
  currency?: string;
  insufficientHistory?: boolean;
};

const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "1y", label: "1A" },
];

export function CollectionValueChart({
  series7d,
  series30d,
  series90d,
  series1y,
  currency = "BRL",
  insufficientHistory,
}: Props) {
  const [range, setRange] = useState<Range>("30d");
  const series = useMemo(() => {
    if (range === "7d") return series7d;
    if (range === "90d") return series90d;
    if (range === "1y") return series1y;
    return series30d;
  }, [range, series7d, series30d, series90d, series1y]);

  const max = Math.max(...series.map((p) => p.value), 1);
  const min = Math.min(...series.map((p) => p.value), 0);
  const span = Math.max(max - min, 1);

  return (
    <section
      className="rounded-xl border border-border/80 bg-card/40 p-4"
      data-testid="collection-value-chart"
      aria-labelledby="collection-chart-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="collection-chart-title" className="text-h3 text-foreground">
          Valor da coleção
        </h2>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption font-medium",
                range === r.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {(insufficientHistory || series.length < 2) && (
        <p className="mt-4 text-small text-muted-foreground">
          Dados insuficientes para série histórica completa — valores vêm da Pricing/Catalog API
          amostrada.
        </p>
      )}

      {series.length >= 2 && (
        <div className="mt-4">
          <svg
            viewBox="0 0 320 120"
            className="h-36 w-full text-primary"
            role="img"
            aria-label="Gráfico de valor da coleção"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={series
                .map((p, i) => {
                  const x = (i / (series.length - 1)) * 320;
                  const y = 110 - ((p.value - min) / span) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
          <div className="mt-2 flex justify-between text-caption text-muted-foreground">
            <span>{series[0]?.date}</span>
            <span>{formatCurrency(series[series.length - 1]?.value ?? 0, currency)}</span>
            <span>{series[series.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </section>
  );
}
