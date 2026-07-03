"use client";

import { cn } from "@/lib/utils";
import { CATALOG_GAME_SLUGS } from "@/lib/seller-product-categories";

type Props = {
  activeSlug: string;
  onChange: (slug: string) => void;
};

export function GameSelectorTabs({ activeSlug, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
      {CATALOG_GAME_SLUGS.map((game) => (
        <button
          key={game.slug}
          type="button"
          onClick={() => onChange(game.slug)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            activeSlug === game.slug
              ? "bg-luxury-gold/20 text-luxury-gold"
              : "text-luxury-mist hover:bg-white/5",
          )}
        >
          {game.label}
        </button>
      ))}
    </div>
  );
}
