"use client";

import { cn } from "@/lib/utils";

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function AskButton({ loading, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg transition sm:w-auto",
        "bg-[hsl(var(--primary))] hover:brightness-105 active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 focus-visible:ring-offset-2",
      )}
    >
      {loading ? "A consultar…" : "Perguntar"}
    </button>
  );
}
