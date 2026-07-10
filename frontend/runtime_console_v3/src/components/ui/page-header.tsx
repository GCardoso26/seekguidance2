/**
 * PageHeader canônico — consumer + painéis (RC1 / RC11)
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
  className?: string;
  /** display = hero; h1 = página; h2 = seção densa (painel) */
  level?: "display" | "h1" | "h2";
};

const TITLE: Record<NonNullable<PageHeaderProps["level"]>, string> = {
  display: "text-display font-bold tracking-tight text-foreground",
  h1: "text-h1 font-semibold tracking-tight text-foreground",
  h2: "text-h2 font-semibold tracking-tight text-foreground",
};

export function PageHeader({
  title,
  description,
  action,
  meta,
  className,
  level = "h1",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={TITLE[level]}>{title}</h1>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
