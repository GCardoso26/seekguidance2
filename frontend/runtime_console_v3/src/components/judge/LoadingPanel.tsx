"use client";

export function LoadingPanel() {
  return (
    <div className="judge-card flex flex-col items-center justify-center gap-4 rounded-2xl border border-[hsl(var(--border))] py-14">
      <span
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-[hsl(var(--primary))] border-t-transparent"
        aria-hidden
      />
      <p className="text-sm font-medium text-[hsl(222_20%_35%)]">A consultar as regras oficiais…</p>
    </div>
  );
}
