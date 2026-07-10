"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OperationalActionItem } from "@/lib/seller-operational-actions";
import { PageSkeleton } from "@/components/seller-dashboard/PageShell";

const SEVERITY_STYLES = {
  critical: "border-red-500/40 bg-red-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  info: "border-border bg-white/[0.04]",
};

type Props = {
  actions: OperationalActionItem[];
  isLoading?: boolean;
  compact?: boolean;
};

export function OperationalCommandCenter({ actions, isLoading, compact }: Props) {
  if (isLoading) return <PageSkeleton rows={compact ? 2 : 4} />;

  if (actions.length === 0) {
    return (
      <section
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        data-testid="command-center-empty"
      >
        <p className="font-medium text-emerald-200">Tudo em dia</p>
        <p className="mt-1 text-sm text-emerald-100/80">
          Nenhuma ação urgente no momento. Continue monitorando pedidos e estoque.
        </p>
      </section>
    );
  }

  return (
    <section data-testid="command-center">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          O que fazer agora
        </h2>
        {!compact && (
          <Link href="/vendedor/painel/operacao" className="text-xs text-primary hover:underline">
            Centro de operação →
          </Link>
        )}
      </div>
      <div
        className={cn(
          "grid gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {actions.map((item) => (
          <article
            key={item.id}
            className={cn(
              "flex flex-col justify-between rounded-xl border p-4 transition hover:border-primary/30",
              SEVERITY_STYLES[item.severity],
            )}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-sm font-bold tabular-nums">
                  {item.count}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Link
              href={item.href}
              className="mt-3 inline-flex w-fit rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90-light"
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
