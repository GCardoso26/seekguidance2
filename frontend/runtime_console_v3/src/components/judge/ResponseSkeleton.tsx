"use client";

export function ResponseSkeleton() {
  return (
    <div className="judge-card animate-pulse space-y-3 rounded-2xl border border-[hsl(var(--border))] p-5">
      <div className="h-3 w-1/3 rounded bg-[hsl(var(--muted))]" />
      <div className="h-4 w-full rounded bg-[hsl(var(--muted))]" />
      <div className="h-4 w-5/6 rounded bg-[hsl(var(--muted))]" />
      <div className="h-20 w-full rounded bg-[hsl(var(--muted)/0.6)]" />
    </div>
  );
}
