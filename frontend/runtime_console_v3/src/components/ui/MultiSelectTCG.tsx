"use client";

import type { TcgType } from "@/types/judge";
import { TCG_OPTIONS } from "@/types/judge";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
import { getTcgTheme } from "@/styles/tcg-theme";
import { cn } from "@/lib/utils";

type Props = {
  selected: TcgType[];
  onChange: (ids: TcgType[]) => void;
  maxSelection?: number;
  className?: string;
};

export function MultiSelectTCG({ selected, onChange, maxSelection = 5, className }: Props) {
  const { showUpgrade } = useUpgradeModal();

  const toggle = (id: TcgType) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
      return;
    }
    if (selected.length >= maxSelection) {
      showUpgrade("tcgs");
      return;
    }
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
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border p-2">
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
                  ? "border-luxury-gold bg-primary/15 text-primary-light"
                  : "border-border text-muted-foreground hover:border-border",
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground/70">Até {maxSelection} jogos favoritos</p>
    </div>
  );
}
