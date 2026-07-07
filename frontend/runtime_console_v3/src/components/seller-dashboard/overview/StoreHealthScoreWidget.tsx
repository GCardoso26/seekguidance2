"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity } from "lucide-react";
import { computeStoreHealthScore, statusLabel } from "@/lib/seller-store-health-score";
import type { FulfillmentSlaMetrics } from "@/types/seller-dashboard-overview";
import { cn } from "@/lib/utils";

type Props = {
  kycStatus?: string | null;
  sla?: FulfillmentSlaMetrics | null;
  lowStockCount?: number;
  openTickets?: number;
  isLoading?: boolean;
};

const STATUS_STYLES = {
  healthy: {
    ring: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    score: "text-emerald-400",
    bar: "bg-emerald-400",
    pill: "text-emerald-200 bg-emerald-500/15",
  },
  attention: {
    ring: "border-amber-500/30",
    bg: "bg-amber-500/5",
    score: "text-amber-400",
    bar: "bg-amber-400",
    pill: "text-amber-200 bg-amber-500/15",
  },
  critical: {
    ring: "border-red-500/30",
    bg: "bg-red-500/5",
    score: "text-red-400",
    bar: "bg-red-400",
    pill: "text-red-200 bg-red-500/15",
  },
} as const;

export function StoreHealthScoreWidget({
  kycStatus,
  sla,
  lowStockCount = 0,
  openTickets = 0,
  isLoading,
}: Props) {
  const health = useMemo(
    () =>
      computeStoreHealthScore({
        kycStatus,
        sla,
        lowStockCount,
        openTickets,
      }),
    [kycStatus, sla, lowStockCount, openTickets],
  );

  if (isLoading) {
    return (
      <div
        className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/5"
        data-testid="store-health-skeleton"
        aria-busy="true"
      />
    );
  }

  const styles = STATUS_STYLES[health.status];

  return (
    <section
      aria-label="Saúde da loja"
      data-testid="store-health-widget"
      className={cn("rounded-xl border p-5", styles.ring, styles.bg)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white/5 p-2">
            <Activity className="h-5 w-5 text-luxury-gold" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">
              Saúde da loja
            </h2>
            <p className="mt-1 text-xs text-luxury-mist/80">
              Operacional — KYC, fulfillment, estoque e atendimento
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-4xl font-bold tabular-nums", styles.score)}>{health.score}</p>
          <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", styles.pill)}>
            {statusLabel(health.status)}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all", styles.bar)}
          style={{ width: `${health.score}%` }}
          role="progressbar"
          aria-valuenow={health.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Score de saúde da loja"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {health.factors.map((factor) => (
          <div key={factor.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-luxury-mist">{factor.label}</span>
              <span className="tabular-nums text-white">{factor.score}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-luxury-gold/80"
                style={{ width: `${factor.score}%` }}
              />
            </div>
            {factor.hint && (
              <p className="mt-1.5 line-clamp-2 text-[11px] text-luxury-mist/80">{factor.hint}</p>
            )}
          </div>
        ))}
      </div>

      {health.primaryAction && (
        <Link
          href={health.primaryAction.href}
          className="mt-4 inline-flex text-sm font-medium text-luxury-gold hover:underline"
        >
          {health.primaryAction.label} →
        </Link>
      )}
    </section>
  );
}
