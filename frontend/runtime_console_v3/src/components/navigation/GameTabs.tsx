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

export function GameTabs({ games, className }: GameTabsProps) {
  const pathname = usePathname();
  const activeSlug = pathname.match(/^\/loja\/([^/]+)/)?.[1] ?? null;
  const isAll = !activeSlug || activeSlug === "busca" || activeSlug === "cartas" || activeSlug === "tendencias";

  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide",
        className,
      )}
      aria-label="Jogos TCG"
    >
      <Link
        href="/loja/busca"
        aria-current={isAll ? "page" : undefined}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
          isAll
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
          </Link>
        );
      })}
    </nav>
  );
}
