"use client";

import { cn } from "@/lib/utils";
import { CATALOG_GAME_SLUGS, isCatalogGameEnabled } from "@/lib/seller-product-categories";

type Props = {
  activeSlug: string;
  onChange: (slug: string) => void;
};

export function GameSelectorTabs({ activeSlug, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-2">
      {CATALOG_GAME_SLUGS.map((game) => {
        const enabled = isCatalogGameEnabled(game.slug);
        const active = activeSlug === game.slug;
        return (
          <button
            key={game.slug}
            type="button"
            disabled={!enabled}
            title={enabled ? game.label : `${game.label} — em breve`}
            aria-disabled={!enabled}
            onClick={() => {
              if (!enabled) return;
              onChange(game.slug);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              !enabled && "cursor-not-allowed opacity-40 grayscale",
              enabled && active && "bg-primary/20 text-primary",
              enabled && !active && "text-muted-foreground hover:bg-muted/80",
            )}
          >
            {game.label}
          </button>
        );
      })}
    </div>
  );
}
