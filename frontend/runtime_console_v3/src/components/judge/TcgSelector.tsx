"use client";
import { TCG_OPTIONS } from "@/types/judge";
import type { TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  value: TcgType;
  onChange: (tcg: TcgType) => void;
  disabled?: boolean;
};

export function TcgSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {TCG_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={disabled || !opt.enabled}
          onClick={() => opt.enabled && onChange(opt.id)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left text-sm transition hover:border-primary/50 hover:bg-muted/50",
            value === opt.id && "border-primary bg-primary/10 text-primary",
            !opt.enabled && "opacity-50 cursor-not-allowed",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <span className="font-medium block">{opt.label}</span>
          {!opt.enabled && <span className="text-xs text-muted-foreground">Em breve</span>}
        </button>
      ))}
    </div>
  );
}
