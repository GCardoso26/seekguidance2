"use client";

import type { ReactNode } from "react";
import { PageEmpty, PageError, PageSkeleton } from "@/components/ui/async-state";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, description, action, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export { PageEmpty, PageSkeleton, PageError };

type AsyncPageBodyProps = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  skeletonRows?: number;
  children: ReactNode;
};

export function AsyncPageBody({
  isLoading,
  isError,
  onRetry,
  errorMessage = "Não foi possível carregar os dados.",
  skeletonRows = 5,
  children,
}: AsyncPageBodyProps) {
  if (isLoading) return <PageSkeleton rows={skeletonRows} />;
  if (isError) return <PageError message={errorMessage} onRetry={onRetry} />;
  return <>{children}</>;
}

type PageShellProps = {
  children: ReactNode;
  className?: string;
  /** Largura máxima do workspace (default: full dentro do painel) */
  constrained?: boolean;
};

/** Área de conteúdo padronizada dos painéis seller/admin. */
export function PageShell({ children, className, constrained }: PageShellProps) {
  return (
    <main
      className={cn(
        "flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        constrained && "mx-auto w-full max-w-7xl",
        className,
      )}
    >
      {children}
    </main>
  );
}
