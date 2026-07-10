"use client";

import Link from "next/link";
import { useGamificationProfile } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

type UserLevelBadgeProps = {
  className?: string;
  compact?: boolean;
};

function levelColor(level: number): string {
  if (level >= 40) return "#c9a227";
  if (level >= 25) return "#a78bfa";
  if (level >= 10) return "#60a5fa";
  return "#94a3b8";
}

export function UserLevelBadge({ className, compact = false }: UserLevelBadgeProps) {
  const { data, isLoading } = useGamificationProfile();

  if (isLoading) {
    return (
      <div
        className={cn("animate-pulse rounded-full bg-muted", compact ? "h-9 w-9" : "h-12 w-full", className)}
        aria-hidden
      />
    );
  }

  if (!data) return null;

  const color = levelColor(data.current_level);
  const tooltip = `Nível ${data.current_level} · ${data.total_xp.toLocaleString("pt-BR")} XP · Faltam ${data.xp_to_next.toLocaleString("pt-BR")} XP para o nível ${data.current_level + 1}`;

  if (compact) {
    return (
      <Link
        href="/profile/gamification"
        data-testid="user-level-badge"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-foreground ring-1 ring-white/20 transition hover:ring-primary/50",
          className,
        )}
        style={{ backgroundColor: color }}
        title={tooltip}
        aria-label={tooltip}
      >
        {data.current_level}
      </Link>
    );
  }

  return (
    <Link
      href="/profile/gamification"
      data-testid="user-level-badge"
      className={cn(
        "block rounded-lg border border-border bg-card/80 p-4 transition hover:border-primary/30",
        className,
      )}
      title={tooltip}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-foreground"
          style={{ backgroundColor: color }}
        >
          {data.current_level}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nível {data.current_level}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${data.progress_percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Faltam {data.xp_to_next.toLocaleString("pt-BR")} XP para o nível {data.current_level + 1}
          </p>
        </div>
        <span className="text-sm font-bold text-primary">
          {data.total_xp.toLocaleString("pt-BR")} XP
        </span>
      </div>
    </Link>
  );
}
