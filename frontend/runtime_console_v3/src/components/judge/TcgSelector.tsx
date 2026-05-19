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
  const selected = TCG_OPTIONS.find((o) => o.id === value);

  return (
    <div className="space-y-2">
      <label htmlFor="tcg-select" className="text-sm font-medium text-muted-foreground">
        Jogo (TCG)
      </label>
      <select
        id="tcg-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TcgType)}
        className={cn(
          "w-full max-w-md rounded-xl border border-border bg-card px-4 py-2.5 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          disabled && "opacity-60 cursor-not-allowed",
        )}
      >
        {TCG_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id} disabled={!opt.enabled}>
            {opt.label}
            {!opt.enabled ? " (em breve)" : ""}
          </option>
        ))}
      </select>
      {selected?.enabled && (
        <p className="text-xs text-muted-foreground">
          Consulta baseada nas regras oficiais indexadas para {selected.label}.
        </p>
      )}
    </div>
  );
}
