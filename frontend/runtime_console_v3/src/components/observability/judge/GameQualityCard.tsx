"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type GameQualityMetrics = {
  game_slug: string;
  queries_24h?: number;
  thumbs_up_pct?: number | null;
  thumbs_down_pct?: number | null;
  confidence_avg?: number | null;
  cache_hit_rate?: number;
  alert_active?: boolean;
  latency_p95_ms?: number;
};

type Props = {
  metrics: GameQualityMetrics;
};

export function GameQualityCard({ metrics }: Props) {
  const slug = metrics.game_slug.toUpperCase();
  const alert = metrics.alert_active;

  return (
    <Card className={cn(alert && "border-red-300 bg-red-50/40")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{slug}</CardTitle>
          {alert ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              ALERTA
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
              OK
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Consultas 24h</p>
          <p className="font-semibold">{metrics.queries_24h ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Confiança média</p>
          <p className="font-semibold">
            {metrics.confidence_avg != null ? `${Math.round(metrics.confidence_avg * 100)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">👍</p>
          <p className="font-semibold">
            {metrics.thumbs_up_pct != null ? `${Math.round(metrics.thumbs_up_pct * 100)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">👎</p>
          <p className="font-semibold">
            {metrics.thumbs_down_pct != null ? `${Math.round(metrics.thumbs_down_pct * 100)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Cache hit</p>
          <p className="font-semibold">
            {metrics.cache_hit_rate != null ? `${Math.round(metrics.cache_hit_rate * 100)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Latência P95</p>
          <p className="font-semibold">
            {metrics.latency_p95_ms != null ? `${metrics.latency_p95_ms} ms` : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
