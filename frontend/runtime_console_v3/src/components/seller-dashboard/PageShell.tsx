"use client";

import type { ReactNode } from "react";
import { PageEmpty, PageError, PageSkeleton } from "@/components/ui/async-state";
import { PageHeader as UiPageHeader, type PageHeaderProps as UiPageHeaderProps } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export type PageHeaderProps = Omit<UiPageHeaderProps, "level"> & { level?: UiPageHeaderProps["level"] };

/** Painel seller/admin — default level h2 (densidade Stripe). */
export function PageHeader({ level = "h2", ...props }: PageHeaderProps) {
  return <UiPageHeader level={level} {...props} />;
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
  constrained?: boolean;
};

/** Área de conteúdo padronizada dos painéis seller/admin. */
export function PageShell({ children, className, constrained }: PageShellProps) {
  return (
    <main
      className={cn(
        "flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6",
        constrained && "mx-auto w-full max-w-page",
        className,
      )}
    >
      {children}
    </main>
  );
}
