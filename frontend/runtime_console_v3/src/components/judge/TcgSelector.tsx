"use client";

import type { CSSProperties } from "react";
import { getTcgBrand } from "@/lib/tcg-brand";
import { cn } from "@/lib/utils";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";

type Props = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  disabled?: boolean;
};

export function TcgSelector({ value, onChange, disabled }: Props) {
  const selected = TCG_OPTIONS.find((g) => g.id === value);
  const selectedBrand = selected ? getTcgBrand(selected.id) : null;

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

      {/* Mobile: grelha 2 colunas; tablet+: grelha; lg: carrossel horizontal com cartões maiores */}
      <div
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
              aria-selected={active}
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

      {selected && (
        <p className="text-xs text-[hsl(222_15%_45%)] lg:hidden">
          <span className="font-medium text-[hsl(var(--foreground))]">{selected.label}</span>
          {selectedBrand && ` · ${selectedBrand.publisher}`}
        </p>
      )}
    </div>
  );
}
