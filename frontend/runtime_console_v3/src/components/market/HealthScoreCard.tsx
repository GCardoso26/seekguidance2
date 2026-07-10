import type { HealthScoreResult } from "@/lib/market/health-score";
import { cn } from "@/lib/utils";

interface HealthScoreCardProps {
  data: HealthScoreResult;
}

const STATUS_LABEL = {
  bullish: "Otimista",
  neutral: "Neutro",
  bearish: "Pessimista",
} as const;

export function HealthScoreCard({ data }: HealthScoreCardProps) {
  const color =
    data.score > 70 ? "text-success" : data.score > 40 ? "text-warning" : "text-danger";

  return (
    <article className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">{data.game}</p>
      <p className={cn("mt-2 text-5xl font-bold", color)}>{data.score}</p>
      <p className="mt-1 text-sm text-muted-foreground">{STATUS_LABEL[data.status]}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetricBar label="Liquidez" value={data.liquidity} />
        <MetricBar label="Estabilidade" value={data.priceStability} />
        <MetricBar label="Crescimento" value={data.growth} />
        <MetricBar label="Sentimento" value={data.sentiment} />
      </div>
    </article>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-background">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
