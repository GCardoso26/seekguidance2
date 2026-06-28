"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, description, action, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-luxury-mist">{description}</p>}
        {meta}
      </div>
      {action}
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" data-testid="page-skeleton" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

type PageErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function PageError({ message = "Não foi possível carregar os dados.", onRetry }: PageErrorProps) {
  return (
    <div
      className="rounded-xl border border-red-500/30 bg-red-950/20 p-8 text-center"
      role="alert"
      data-testid="page-error"
    >
      <h3 className="text-lg font-semibold text-red-300">Erro ao carregar</h3>
      <p className="mt-2 text-sm text-luxury-mist">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={`flex-1 space-y-4 overflow-y-auto p-6 ${className ?? ""}`}>{children}</main>
  );
}
