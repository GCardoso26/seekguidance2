"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useLigaPass } from "@/hooks/useLigaPass";
import { LEVEL_COLORS, nextLevelLabel } from "@/types/gamification";
import { cn } from "@/lib/utils";

type LigaPassWidgetProps = {
  className?: string;
  compact?: boolean;
};

export function LigaPassWidget({ className, compact = false }: LigaPassWidgetProps) {
  const { data, isLoading } = useLigaPass();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse rounded-lg border border-white/10 bg-white/5 p-3", className)}>
        <div className="h-10 rounded bg-white/10" />
      </div>
    );
  }

  if (!data) return null;

  const color = data.color_hex || LEVEL_COLORS[data.current_level];

  if (compact) {
    return (
      <Link
        href="/perfil"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-1 ring-white/20",
          className,
        )}
        style={{ backgroundColor: color }}
        title={`${data.level_name} — ${data.total_xp.toLocaleString("pt-BR")} XP`}
        aria-label={`Liga Pass: ${data.level_name}, ${data.total_xp} XP`}
      >
        {data.current_level[0]?.toUpperCase()}
      </Link>
    );
  }

  return (
    <div className={cn("rounded-lg border border-white/10 bg-luxury-obsidian/80 p-4", className)}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {data.current_level[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-luxury-frost">{data.level_name}</p>
          <Progress value={data.progress_percent} className="mt-1" />
          <p className="mt-1 text-xs text-luxury-mist">
            {data.current_level === "judge"
              ? "Nível máximo alcançado"
              : `${data.xp_to_next.toLocaleString("pt-BR")} XP para ${nextLevelLabel(data.current_level)}`}
          </p>
        </div>
        <span className="text-sm font-bold text-luxury-gold">
          {data.total_xp.toLocaleString("pt-BR")} XP
        </span>
      </div>

      {data.benefits.cashback_percent > 0 && (
        <p className="mt-2 text-xs text-emerald-400">
          {data.benefits.cashback_percent}% cashback em compras
        </p>
      )}

      <div className="mt-3 flex gap-3 text-xs text-luxury-mist">
        <span>{data.stats.purchases} compras</span>
        <span>{data.stats.sales} vendas</span>
        <span>{data.stats.decks} decks</span>
      </div>
    </div>
  );
}
