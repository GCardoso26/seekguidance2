"use client";

import {
  Award,
  Crown,
  Flame,
  MessageCircle,
  Search,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Search,
  Award,
  Flame,
  Crown,
  Trophy,
  MessageCircle,
  Users,
};

const COLOR_MAP: Record<string, string> = {
  yellow: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  blue: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  purple: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  orange: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  gold: "text-luxury-gold border-luxury-gold/40 bg-luxury-gold/10",
  silver: "text-slate-300 border-slate-400/40 bg-slate-400/10",
  green: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  pink: "text-pink-400 border-pink-400/40 bg-pink-400/10",
};

export type BadgeView = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  condition_type: string;
  condition_value: number;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
  current: number;
};

type Props = {
  badge: BadgeView;
  animate?: boolean;
};

export function BadgeCard({ badge, animate }: Props) {
  const Icon = ICONS[badge.icon] ?? Award;
  const colorClass = COLOR_MAP[badge.color] ?? COLOR_MAP.yellow;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-2xl border p-4 text-center transition",
        badge.earned ? colorClass : "border-white/10 bg-white/5 grayscale opacity-70",
        animate && badge.earned && "animate-pulse ring-2 ring-luxury-gold/50",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-14 w-14 items-center justify-center rounded-full border",
          badge.earned ? colorClass : "border-white/10 bg-black/20",
        )}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-luxury-frost">{badge.name}</h3>
      <p className="mt-1 text-xs text-luxury-mist">{badge.description}</p>
      {!badge.earned && badge.condition_type !== "tournament_rank" && (
        <p className="mt-2 text-[11px] font-medium text-luxury-gold-light">
          {badge.progress}/{badge.condition_value}
        </p>
      )}
      {badge.earned && badge.earnedAt && (
        <p className="mt-2 text-[10px] text-luxury-mist/70">
          {new Date(badge.earnedAt).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}
