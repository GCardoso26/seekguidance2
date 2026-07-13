"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceHistory, type PriceHistoryRange } from "@/hooks/usePriceHistory";

interface PriceChartProps {
  cardId: string;
  range: PriceHistoryRange;
  condition?: string;
  foil?: boolean;
}

type ChartPoint = {
  date: string;
  price: number;
  condition?: string;
  foil?: boolean;
  volume?: number;
  ma7?: number;
};

function buildMovingAverage(history: ChartPoint[]): ChartPoint[] {
  return history.map((point, index) => {
    const start = Math.max(0, index - 6);
    const slice = history.slice(start, index + 1);
    const avg = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
    return {
      ...point,
      date: new Date(point.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      ma7: Number(avg.toFixed(2)),
    };
  });
}

export function PriceChart({ cardId, range, condition, foil }: PriceChartProps) {
  const { data: history, isLoading } = usePriceHistory({ cardId, range, condition, foil });

  const dataWithMA = useMemo(() => {
    if (!history?.length) return [];
    return buildMovingAverage(history);
  }, [history]);

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  if (!history || history.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Sem dados de preço para este período
      </div>
    );
  }

  const minPrice = Math.min(...history.map((p) => p.price));
  const maxPrice = Math.max(...history.map((p) => p.price));
  const padding = (maxPrice - minPrice) * 0.1 || maxPrice * 0.05;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dataWithMA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} minTickGap={30} />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number | string) => `$${Number(value).toFixed(0)}`}
            width={56}
          />
          <Tooltip
            content={({
              active,
              payload,
              label,
            }: {
              active?: boolean;
              payload?: Array<{ payload?: ChartPoint }>;
              label?: string;
            }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ChartPoint;
              return (
                <div className="rounded-lg border bg-background p-3 shadow-lg">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-lg font-bold text-primary">${point.price.toFixed(2)}</p>
                  {point.ma7 !== undefined && (
                    <p className="text-xs text-muted-foreground">Média 7d: ${point.ma7.toFixed(2)}</p>
                  )}
                  {point.condition && (
                    <p className="text-xs text-muted-foreground">Condição: {point.condition}</p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine y={minPrice} stroke="#22C55E" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={maxPrice} stroke="#EF4444" strokeDasharray="3 3" opacity={0.5} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="ma7"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="5 5"
            fill="none"
            dot={false}
          />
          <Brush dataKey="date" height={30} stroke="hsl(var(--primary))" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
