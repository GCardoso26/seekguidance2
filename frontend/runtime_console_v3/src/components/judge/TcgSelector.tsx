"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTcgBrand } from "@/lib/tcg-brand";
import { cn } from "@/lib/utils";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";

type Props = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  disabled?: boolean;
  responsePanelId?: string;
};

export function TcgSelector({ value, onChange, disabled, responsePanelId }: Props) {
  const selected = TCG_OPTIONS.find((g) => g.id === value);
  const selectedBrand = selected ? getTcgBrand(selected.id) : null;
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
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
          Escolha o jogo
        </p>
        {selectedBrand && (
          <p className="hidden text-[10px] text-[hsl(222_15%_50%)] sm:block">
            {selectedBrand.publisher}
          </p>
        )}
      </div>

      <div className="relative lg:px-1">
        {canScrollLeft && (
          <>
            <div
              className="judge-tcg-scroll-fade judge-tcg-scroll-fade--left pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 lg:block"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => scrollBy("left")}
              className="judge-tcg-scroll-btn absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
              aria-label="Jogos anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        {canScrollRight && (
          <>
            <div
              className="judge-tcg-scroll-fade judge-tcg-scroll-fade--right pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 lg:block"
              aria-hidden
            />
            <button
              type="button"
              onClick={() => scrollBy("right")}
              className="judge-tcg-scroll-btn absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
              aria-label="Mais jogos"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className={cn(
            "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3",
            "lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-2 lg:scroll-smooth lg:snap-x lg:snap-mandatory",
            "[scrollbar-width:thin]",
          )}
          role="tablist"
          aria-label="Selecionar jogo"
        >
          {TCG_OPTIONS.map((g) => {
            const active = value === g.id;
            const brand = getTcgBrand(g.id);
            const canSelect = g.enabled && !disabled;

            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                id={`judge-tcg-tab-${g.id}`}
                aria-selected={active}
                aria-controls={responsePanelId}
                disabled={!canSelect}
                onClick={() => canSelect && onChange(g.id)}
                title={g.enabled ? g.label : `${g.label} — em breve`}
                style={
                  {
                    "--tcg-accent": brand.accent,
                    "--tcg-accent-fg": brand.accentFg,
                  } as CSSProperties
                }
                className={cn(
                  "judge-tcg-card group relative flex min-h-[88px] flex-col items-start gap-2 rounded-2xl border-2 bg-white p-3 text-left transition",
                  "lg:min-w-[148px] lg:max-w-[148px] lg:shrink-0 lg:snap-start",
                  !g.enabled && "cursor-not-allowed opacity-45",
                  canSelect && !active && "hover:border-[hsl(var(--tcg-accent)/0.45)] hover:shadow-md",
                  active && "judge-tcg-card--selected",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-black tracking-tight",
                    active
                      ? "bg-[hsl(var(--tcg-accent))] text-[hsl(var(--tcg-accent-fg))]"
                      : "bg-[hsl(var(--tcg-accent)/0.12)] text-[hsl(var(--tcg-accent))]",
                  )}
                  aria-hidden
                >
                  {brand.icon}
                </span>
                <span className="line-clamp-2 text-xs font-semibold leading-snug text-[hsl(var(--foreground))] sm:text-[13px]">
                  {g.label}
                </span>
                {!g.enabled && (
                  <span className="text-[10px] font-medium text-[hsl(222_15%_50%)]">Em breve</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <p className="text-xs text-[hsl(222_15%_45%)] lg:hidden">
          <span className="font-medium text-[hsl(var(--foreground))]">{selected.label}</span>
          {selectedBrand && ` · ${selectedBrand.publisher}`}
        </p>
      )}
    </div>
  );
}
