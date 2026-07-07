"use client";

import type { ReactNode } from "react";
import { PageEmpty, PageError, PageSkeleton } from "@/components/ui/async-state";

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

export { PageEmpty, PageSkeleton, PageError };

type AsyncPageBodyProps = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  skeletonRows?: number;
  children: ReactNode;
};

/** Estados async padronizados dentro de PageShell. */
export function AsyncPageBody({
  isLoading,
  isError,
  onRetry,
  errorMessage = "Não foi possível carregar os dados.",
  skeletonRows = 5,
  children,
}: AsyncPageBodyProps) {
  if (isLoading) return <PageSkeleton rows={skeletonRows} />;
  if (isError) {
    return <PageError message={errorMessage} onRetry={onRetry} />;
  }
  return <>{children}</>;
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
