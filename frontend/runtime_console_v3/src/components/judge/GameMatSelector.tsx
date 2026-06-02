"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTcgLogo } from "@/lib/tcg-logos";
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
  variant?: "default" | "compact";
};

function GameMat({
  game,
  selected,
  disabled,
  onSelect,
  responsePanelId,
  variant = "default",
}: {
  game: TcgOption;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  responsePanelId?: string;
  variant?: "default" | "compact";
}) {
  const theme = getTcgTheme(game.id);
  const logo = getTcgLogo(game.id);
  const compact = variant === "compact";
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
        "judge-game-mat relative flex flex-col justify-between overflow-hidden rounded-xl text-left transition",
        compact ? "min-h-[72px] min-w-[72px] p-2 md:min-w-[80px]" : "min-h-[88px] min-w-[140px] p-3 lg:min-w-[148px]",
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
      <div
        className={cn(
          "relative mx-auto mb-1 w-full",
          compact ? "aspect-square max-w-[48px]" : "aspect-square max-w-[56px]",
        )}
      >
        <Image
          src={logo.src}
          alt={logo.alt}
          fill
          className="object-contain p-1"
          sizes={compact ? "64px" : "128px"}
        />
      </div>
      <div>
        {!compact && (
          <span className="text-[10px] font-black tracking-tight text-white/80">{theme.icon}</span>
        )}
        <p
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-[var(--tcg-text-primary)]",
            compact ? "text-[10px]" : "mt-0.5 text-xs",
          )}
        >
          {compact ? theme.icon : game.label}
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
  variant = "default",
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
    <div className={cn("space-y-3", variant === "compact" && "space-y-2")}>
      <div className="flex items-end justify-between gap-2">
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-[var(--tcg-text-secondary)]",
            variant === "compact" ? "text-[10px]" : "text-xs",
          )}
        >
          {variant === "compact" ? "Jogos suportados" : "Escolha o tapete de jogo"}
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
            "flex overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin]",
            variant === "compact"
              ? "grid grid-cols-4 gap-2 overflow-visible md:grid-cols-7"
              : "gap-3",
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
              variant={variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Alias legado — migração gradual. */
export const TcgSelector = GameMatSelector;
