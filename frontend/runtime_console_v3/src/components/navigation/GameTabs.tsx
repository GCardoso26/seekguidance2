"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { gameSlugFromId, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { GameInfo } from "@/lib/catalog-games";

interface GameTabsProps {
  games: GameInfo[];
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export function GameTabs({ games, className }: GameTabsProps) {
  const pathname = usePathname();
  const activeSlug = pathname.match(/^\/loja\/([^/]+)/)?.[1] ?? null;
  const isAll = !activeSlug || activeSlug === "busca" || activeSlug === "cartas" || activeSlug === "tendencias";

  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide",
        className,
      )}
      role="tablist"
      aria-label="Jogos TCG"
    >
      <Link
        href="/loja/busca"
        role="tab"
        aria-selected={isAll}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
          isAll
            ? "bg-luxury-gold text-luxury-onyx"
            : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
        )}
      >
        Todos
      </Link>

      {games.map((game) => {
        const slug = gameSlugFromId(game.id as GameId);
        const token = GAME_TOKENS[game.id as GameId];
        const active = activeSlug === slug;
        return (
          <Link
            key={game.id}
            href={`/loja/${slug}`}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-luxury-gold text-luxury-onyx"
                : "text-luxury-mist hover:bg-white/5 hover:text-luxury-frost",
              !game.isAvailable && "opacity-50",
            )}
          >
            <Image
              src={game.logoUrl || token.logo}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 rounded object-contain"
            />
            <span>{game.name}</span>
            {game.cardCount > 0 && (
              <span className="text-xs opacity-70">({formatCount(game.cardCount)})</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
