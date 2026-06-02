"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTcgTheme } from "@/styles/tcg-theme";
import { hapticFeedback } from "@/utils/haptic";
import { cn } from "@/lib/utils";
import { TCG_OPTIONS, type TcgOption, type TcgType } from "@/types/judge";

type Props = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  disabled?: boolean;
  responsePanelId?: string;
  options?: TcgOption[];
};

function GameMat({
  game,
  selected,
  disabled,
  onSelect,
  responsePanelId,
}: {
  game: TcgOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  responsePanelId?: string;
}) {
  const theme = getTcgTheme(game.id);
  const canSelect = game.enabled && !disabled;
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="tab"
      id={`judge-tcg-tab-${game.id}`}
      aria-selected={selected}
      aria-controls={responsePanelId}
      disabled={!canSelect}
      layout={!reduceMotion}
      onClick={() => {
        if (!canSelect) return;
        onSelect();
      }}
      title={game.enabled ? game.label : `${game.label} — em breve`}
      style={{ "--mat-gradient": theme.themeGradient } as CSSProperties}
      className={cn(
        "judge-game-mat relative flex min-h-[88px] min-w-[140px] flex-col justify-between overflow-hidden rounded-xl p-3 text-left transition",
        "lg:min-w-[148px]",
        !game.enabled && "cursor-not-allowed opacity-50",
        selected && "judge-game-mat--selected z-10",
        canSelect && !selected && "hover:brightness-110",
      )}
      whileTap={canSelect && !reduceMotion ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      {!game.enabled && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 text-[10px] font-bold uppercase tracking-wide text-white">
          Em breve
        </span>
      )}
      {game.beta && game.enabled && (
        <span className="absolute right-2 top-2 z-10 animate-pulse rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
          Beta
        </span>
      )}
      <span className="text-2xl" aria-hidden>
        {theme.emoji}
      </span>
      <div>
        <span className="text-[10px] font-black tracking-tight text-white/80">{theme.icon}</span>
        <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-[var(--tcg-text-primary)]">
          {game.label}
        </p>
      </div>
    </motion.button>
  );
}

export function GameMatSelector({
  value,
  onChange,
  disabled,
  responsePanelId,
  options = TCG_OPTIONS,
}: Props) {
  const selected = options.find((g) => g.id === value);
  const selectedTheme = selected ? getTcgTheme(selected.id) : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      ro.disconnect();
    };
  }, [updateScrollHints]);

  function scrollBy(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tcg-text-secondary)]">
          Escolha o tapete de jogo
        </p>
        {selectedTheme && (
          <p className="hidden text-[10px] text-[var(--tcg-text-secondary)] sm:block">
            {selectedTheme.publisher}
          </p>
        )}
      </div>

      <div className="relative lg:px-1">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="judge-tcg-scroll-btn absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
            aria-label="Jogos anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="judge-tcg-scroll-btn absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
            aria-label="Mais jogos"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory",
            "[scrollbar-width:thin]",
          )}
          role="tablist"
          aria-label="Selecionar jogo"
        >
          {options.map((g) => (
            <GameMat
              key={g.id}
              game={g}
              selected={value === g.id}
              disabled={!!disabled}
              onSelect={() => {
                hapticFeedback("light");
                onChange(g.id);
              }}
              responsePanelId={responsePanelId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Alias legado — migração gradual. */
export const TcgSelector = GameMatSelector;
