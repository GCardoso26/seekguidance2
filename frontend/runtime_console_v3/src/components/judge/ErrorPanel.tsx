"use client";

import { cn } from "@/lib/utils";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorPanel({ message, onRetry }: Props) {
  return (
    <div
      className={cn(
        "judge-card flex flex-col gap-3 rounded-2xl border border-[hsl(var(--danger))]/30 p-4 sm:flex-row sm:items-center sm:justify-between",
        "bg-[hsl(var(--danger))]/5",
      )}
    >
      <p className="text-sm text-[hsl(var(--danger))]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-full border border-[hsl(var(--border))] bg-white px-4 py-2 text-xs font-semibold hover:bg-[hsl(var(--muted))]"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
