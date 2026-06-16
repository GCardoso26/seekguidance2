"use client";

import type { TcgType } from "@/types/judge";
import { TCG_OPTIONS } from "@/types/judge";
import { getTcgTheme } from "@/styles/tcg-theme";
import { cn } from "@/lib/utils";

type Props = {
  selected: TcgType[];
  onChange: (ids: TcgType[]) => void;
  maxSelection?: number;
  className?: string;
};

export function MultiSelectTCG({ selected, onChange, maxSelection = 5, className }: Props) {
  const toggle = (id: TcgType) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
      return;
    }
    if (selected.length >= maxSelection) return;
    onChange([...selected, id]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const theme = getTcgTheme(id);
          const label = TCG_OPTIONS.find((g) => g.id === id)?.label ?? id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: `hsl(${theme.accent} / 0.5)`,
                backgroundColor: `hsl(${theme.accent} / 0.15)`,
                color: `hsl(${theme.accent})`,
              }}
            >
              {label} ×
            </button>
          );
        })}
      </div>
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
        {TCG_OPTIONS.filter((g) => g.enabled).map((g) => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={cn(
                "rounded-lg border px-2 py-1 text-xs transition",
                active
                  ? "border-luxury-gold bg-luxury-gold/15 text-luxury-gold-light"
                  : "border-white/10 text-luxury-mist hover:border-white/20",
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-luxury-mist/70">Até {maxSelection} jogos favoritos</p>
    </div>
  );
}
