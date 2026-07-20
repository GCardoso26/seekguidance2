"use client";

import { formatRarityDisplay, findRarityOption, getRarityOptions } from "@/lib/game-config/rarity";
import { cn } from "@/lib/utils";

type Props = {
  game: string | undefined | null;
  rarity: string | undefined | null;
  className?: string;
};

/** Badge de raridade — label e cor vêm exclusivamente de GameConfiguration. */
export function RarityBadge({ game, rarity, className }: Props) {
  if (!rarity?.trim()) return null;
  const options = getRarityOptions(game);
  const opt = findRarityOption(options, rarity);
  const label = formatRarityDisplay(game, rarity);
  const color = opt?.color ?? "#9CA3AF";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}
