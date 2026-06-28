"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  accent?: string;
  accentFg?: string;
};

export function AskButton({
  loading,
  disabled,
  onClick,
  accent = "0 82% 52%",
  accentFg = "0 0% 100%",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      style={
        {
          "--tcg-accent": accent,
          "--tcg-accent-fg": accentFg,
        } as CSSProperties & Record<string, string>
      }
      className={cn(
        "inline-flex w-full items-center justify-center rounded-full px-8 py-3 text-sm font-bold shadow-lg transition sm:w-auto",
        "bg-[hsl(var(--tcg-accent))] text-[hsl(var(--tcg-accent-fg))]",
        "hover:brightness-105 active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--tcg-accent))]/50 focus-visible:ring-offset-2",
      )}
    >
      {loading ? "A consultar…" : "Perguntar"}
    </button>
  );
}
