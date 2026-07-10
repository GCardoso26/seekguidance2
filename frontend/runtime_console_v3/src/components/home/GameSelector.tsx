"use client";

import Image from "next/image";
import { useCallback, useRef, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GameInfo } from "@/lib/catalog-games";

export interface GameSelectorProps {
  games: GameInfo[];
  onSelect: (gameId: string) => void;
  selectedGame?: string;
}

function formatCardCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}k`;
  return count.toLocaleString("pt-BR");
}

export function GameSelector({ games, onSelect, selectedGame }: GameSelectorProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    el?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number, game: GameInfo) => {
      if (!game.isAvailable) return;

      const cols = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : 2;
      let next = index;

      switch (event.key) {
        case "ArrowRight":
          next = Math.min(index + 1, games.length - 1);
          break;
        case "ArrowLeft":
          next = Math.max(index - 1, 0);
          break;
        case "ArrowDown":
          next = Math.min(index + cols, games.length - 1);
          break;
        case "ArrowUp":
          next = Math.max(index - cols, 0);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          onSelect(game.id);
          return;
        default:
          return;
      }

      event.preventDefault();
      focusItem(next);
    },
    [focusItem, games.length, onSelect],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Escolha seu jogo de cartas"
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
    >
      {games.map((game, index) => {
        const selected = selectedGame === game.id;
        const disabled = !game.isAvailable;

        return (
          <button
            key={game.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            disabled={disabled}
            tabIndex={selected || (!selectedGame && index === 0) ? 0 : -1}
            onClick={() => game.isAvailable && onSelect(game.id)}
            onKeyDown={(e) => handleKeyDown(e, index, game)}
            className={cn(
              "group relative flex flex-col items-center rounded-xl border bg-card p-4 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              disabled && "cursor-not-allowed opacity-50",
              !disabled && "hover:-translate-y-0.5 hover:shadow-lg",
              selected && "border-2 bg-muted/40",
              !selected && !disabled && "border-border hover:border-primary/40",
            )}
            style={{
              borderColor: selected ? game.primaryColor : undefined,
              boxShadow: !disabled && !selected ? undefined : selected ? `0 0 0 1px ${game.primaryColor}33` : undefined,
              ...( !disabled && !selected
                ? {}
                : {}),
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              e.currentTarget.style.boxShadow = `0 10px 25px -5px ${game.primaryColor}40`;
            }}
            onMouseLeave={(e) => {
              if (selected) {
                e.currentTarget.style.boxShadow = `0 0 0 1px ${game.primaryColor}33`;
              } else {
                e.currentTarget.style.boxShadow = "";
              }
            }}
          >
            {disabled && (
              <Badge
                variant="default"
                className="absolute right-2 top-2 text-caption uppercase tracking-wide"
              >
                Em breve
              </Badge>
            )}

            <div
              className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-lg bg-muted/30 dark:[&_img]:brightness-90 dark:[&_img]:invert-[0.08]"
              style={{ backgroundColor: `${game.primaryColor}12` }}
            >
              <Image
                src={game.logoUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                aria-hidden
              />
            </div>

            <span className="text-sm font-semibold leading-tight text-foreground">{game.name}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {game.isAvailable
                ? `${formatCardCount(game.cardCount)} cartas`
                : "Catálogo em ingestão"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
