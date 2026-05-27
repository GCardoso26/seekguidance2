"use client";

import type { CSSProperties } from "react";

type Props = {
  accent?: string;
};

export function LoadingPanel({ accent }: Props) {
  const style = {
    "--tcg-accent": accent ?? "0 82% 52%",
  } as CSSProperties;

  return (
    <div
      className="judge-card overflow-hidden rounded-2xl border border-[hsl(var(--border))]"
      role="status"
      aria-live="polite"
      aria-label="A consultar as regras oficiais"
      style={style}
    >
      <div className="h-1 animate-pulse bg-gradient-to-r from-[hsl(var(--tcg-accent))] to-[hsl(var(--tcg-accent)/0.55)]" />

      <div className="space-y-4 p-5 sm:p-6">
        <div className="h-3 w-3/4 max-w-md animate-pulse rounded bg-[hsl(var(--muted))]" />

        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
          <div className="h-6 w-36 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
          <div className="h-3 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[hsl(var(--muted))]" />
        </div>

        <div className="space-y-3 border-t border-[hsl(var(--border))] pt-4">
          <div className="h-4 w-32 animate-pulse rounded bg-[hsl(var(--muted))]" />
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
            <div className="flex gap-2">
              <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(var(--muted))]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[hsl(var(--muted))]" />
              </div>
            </div>
          </div>
        </div>

        <p className="sr-only">A consultar as regras oficiais…</p>
      </div>
    </div>
  );
}
