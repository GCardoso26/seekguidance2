import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Skeleton de página (painel vendedor / listagens). */
export function PageSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="page-skeleton"
      aria-busy="true"
      aria-label="Carregando"
    >
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
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function PageError({
  title = "Erro ao carregar",
  message = "Não foi possível carregar os dados.",
  onRetry,
  className,
}: PageErrorProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-red-500/30 bg-red-950/20 p-8 text-center",
        className,
      )}
      role="alert"
      data-testid="page-error"
    >
      <AlertCircle className="mx-auto h-8 w-8 text-red-400" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold text-red-300">{title}</h3>
      <p className="mt-2 text-sm text-luxury-mist">{message}</p>
      {onRetry && (
        <Button type="button" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

type PageEmptyProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  onAction?: () => void;
  actionLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "panel";
  className?: string;
};

export function PageEmpty({
  title,
  description,
  action,
  onAction,
  actionLabel,
  icon,
  variant = "default",
  className,
}: PageEmptyProps) {
  const defaultIcon = icon ?? <Search className="h-10 w-10 text-muted-foreground" aria-hidden />;

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-white/15 bg-white/5 p-10 text-center",
          className,
        )}
        data-testid="page-empty"
      >
        <p className="font-medium text-white">{title}</p>
        {description && <p className="mt-2 text-sm text-luxury-mist">{description}</p>}
        {(action || onAction) && (
          <div className="mt-4">
            {action ? (
              <Link
                href={action.href}
                className="inline-flex rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
              >
                {action.label}
              </Link>
            ) : (
              <Button type="button" onClick={onAction}>
                {actionLabel ?? "Tentar novamente"}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center px-4 py-16 text-center", className)}
      data-testid="page-empty"
    >
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        {defaultIcon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {action.label}
        </Link>
      )}
      {onAction && !action && (
        <Button type="button" className="mt-4" onClick={onAction}>
          {actionLabel ?? "Tentar novamente"}
        </Button>
      )}
    </div>
  );
}

type InlineAlertProps = {
  message: string;
  tone?: "error" | "warning" | "info";
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function InlineAlert({
  message,
  tone = "error",
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: InlineAlertProps) {
  const tones = {
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  };

  return (
    <div
      className={cn("rounded-lg border p-3 text-sm", tones[tone], className)}
      role="alert"
      data-testid="inline-alert"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-medium underline underline-offset-2 hover:no-underline"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Loading inline com spinner (substitui texto "Carregando…"). */
export function InlineLoading({ message = "Carregando…", className }: { message?: string; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2 py-12 text-sm text-luxury-mist", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-luxury-gold" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
