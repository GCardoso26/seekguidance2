"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameMegaMenuPanel } from "@/components/games/GameMegaMenuPanel";
import { getMegaMenuGames } from "@/lib/catalog-games";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { GAME_TOKENS, gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function GameMegaMenu({ className }: Props) {
  const pathname = usePathname();
  const { data: health } = useCatalogHealth();
  const games = getMegaMenuGames(health);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeSlug = pathname.match(/^\/loja\/([^/]+)/)?.[1] ?? null;
  const openGame = openSlug ? games.find((g) => gameSlugFromId(g.id as GameId) === openSlug) : null;
  const openGameId = openGame?.id as GameId | undefined;

  const close = useCallback(() => setOpenSlug(null), []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [close]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full border-t border-border/60", className)}
      onMouseLeave={close}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className="flex items-center gap-0.5 overflow-x-auto py-2 scrollbar-hide"
          aria-label="Jogos TCG — categorias"
        >
          <Link
            href="/loja/busca"
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              !activeSlug || activeSlug === "busca"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            onMouseEnter={close}
          >
            Todos
          </Link>

          {games.map((game) => {
            const slug = gameSlugFromId(game.id as GameId);
            const token = GAME_TOKENS[game.id as GameId];
            const active = activeSlug === slug;
            const isOpen = openSlug === slug;

            return (
              <button
                key={game.id}
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setOpenSlug(isOpen ? null : slug)}
                onMouseEnter={() => setOpenSlug(slug)}
                onFocus={() => setOpenSlug(slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active || isOpen
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Image
                  src={game.logoUrl || token.logo}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded object-contain"
                />
                <span className="max-w-[9rem] truncate sm:max-w-none">{game.name}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-180")} />
              </button>
            );
          })}

          <Link
            href="/loja"
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-primary"
            onMouseEnter={close}
          >
            Todos os jogos
          </Link>
        </nav>
      </div>

      {openSlug && openGameId && (
        <div
          className="absolute inset-x-0 top-full z-[60] border-t border-border bg-card/98 shadow-2xl backdrop-blur-sm"
          role="region"
          aria-label={`Menu ${GAME_TOKENS[openGameId].name}`}
        >
          <div className="mx-auto max-w-7xl px-4 py-1">
            <div className="overflow-hidden rounded-b-xl border border-t-0 border-border bg-card">
              <GameMegaMenuPanel gameId={openGameId} slug={openSlug} onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
