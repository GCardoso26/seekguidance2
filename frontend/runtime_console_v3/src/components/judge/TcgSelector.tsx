"use client";

import { cn } from "@/lib/utils";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";

type Props = {
  value: TcgType;
  onChange: (v: TcgType) => void;
  disabled?: boolean;
};

export function TcgSelector({ value, onChange, disabled }: Props) {
  const selected = TCG_OPTIONS.find((g) => g.id === value);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">
        Jogo
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Selecionar jogo"
      >
        {TCG_OPTIONS.map((g) => {
          const active = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled || !g.enabled}
              onClick={() => g.enabled && onChange(g.id)}
              title={g.enabled ? g.label : `${g.label} — em breve`}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition sm:px-4 sm:text-sm",
                "border-[hsl(var(--border))] bg-white",
                !g.enabled && "cursor-not-allowed opacity-40",
                g.enabled && "hover:border-[hsl(var(--primary))]/40",
                active && g.enabled && "judge-chip-active",
                active && !g.enabled && "border-[hsl(var(--border))] bg-[hsl(var(--muted))]",
              )}
            >
              {g.label.split(/[:\s]/)[0]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[hsl(222_15%_45%)]">
        {selected?.label}
        {selected && !selected.enabled && " · em breve"}
      </p>
    </div>
  );
}
