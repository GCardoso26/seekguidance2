"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  Crown,
  Flame,
  Heart,
  MessageCircle,
  Scale,
  ShoppingBag,
  Star,
  Store,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useGamificationBadges } from "@/hooks/useGamification";
import { BADGE_CATEGORY_LABELS } from "@/lib/badges";
import type { GamificationBadgeCategory } from "@/types/gamification-profile";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ShoppingBag,
  Heart,
  Bell,
  Store,
  Crown,
  Zap,
  Trophy,
  Award,
  Flame,
  Scale,
  BookOpen,
  Users,
  Star,
  MessageCircle,
};

const RARITY_RING: Record<string, string> = {
  common: "ring-white/20",
  rare: "ring-blue-400/40",
  epic: "ring-purple-400/40",
  legendary: "ring-luxury-gold/50",
};

const CATEGORIES: Array<GamificationBadgeCategory | "all"> = [
  "all",
  "buyer",
  "seller",
  "tournament",
  "community",
  "special",
];

export function BadgesGrid() {
  const { data, isLoading } = useGamificationBadges();
  const [category, setCategory] = useState<GamificationBadgeCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const badges = useMemo(() => {
    const list = data?.badges ?? [];
    if (category === "all") return list;
    return list.filter((b) => b.category === category);
  }, [data?.badges, category]);

  const selected = badges.find((b) => b.id === selectedId) ?? data?.badges.find((b) => b.id === selectedId);

  if (isLoading) {
    return <p className="text-sm text-luxury-mist">Carregando badges…</p>;
  }

  return (
    <div data-testid="badges-grid">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              category === cat
                ? "bg-luxury-gold text-luxury-onyx"
                : "bg-white/5 text-luxury-mist hover:bg-white/10",
            )}
          >
            {cat === "all" ? "Todos" : BADGE_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] ?? Award;
          return (
            <button
              key={badge.id}
              type="button"
              data-testid={`badge-card-${badge.id}`}
              onClick={() => setSelectedId(badge.id)}
              className={cn(
                "flex flex-col items-center rounded-2xl border p-4 text-center transition",
                badge.unlocked
                  ? "border-luxury-gold/30 bg-luxury-gold/5"
                  : "border-white/10 bg-white/5 grayscale opacity-60",
                "ring-2",
                RARITY_RING[badge.rarity],
              )}
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20">
                <Icon className="h-6 w-6 text-luxury-frost" aria-hidden />
              </div>
              <span className="text-sm font-semibold text-luxury-frost">{badge.name}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="mt-6 rounded-xl border border-white/10 bg-luxury-obsidian/80 p-5"
          data-testid="badge-detail"
        >
          <h3 className="text-lg font-semibold text-luxury-frost">{selected.name}</h3>
          <p className="mt-1 text-sm text-luxury-mist">{selected.description}</p>
          <p className="mt-2 text-xs text-luxury-gold-light">
            Como desbloquear: {selected.unlock_hint}
          </p>
          {selected.unlocked && selected.unlocked_at && (
            <p className="mt-2 text-xs text-emerald-400">
              Desbloqueado em {new Date(selected.unlocked_at).toLocaleDateString("pt-BR")}
            </p>
          )}
          {!selected.unlocked && (
            <p className="mt-2 text-xs text-luxury-mist">Ainda bloqueado</p>
          )}
        </div>
      )}
    </div>
  );
}
