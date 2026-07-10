"use client";

import { useState } from "react";
import { PageSkeleton } from "@/components/seller-dashboard/PageShell";
import { useDashboardKpis, type DashboardKpiPeriod } from "@/hooks/useDashboardKpis";

const PERIODS: { id: DashboardKpiPeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

export function DashboardKpiStrip() {
  const [period, setPeriod] = useState<DashboardKpiPeriod>("today");
  const { kpis, isLoading } = useDashboardKpis(period);

  return (
    <section className="space-y-3" data-testid="dashboard-kpi-strip">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Indicadores</h2>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-3 py-1 text-caption transition-colors ${
                period === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <PageSkeleton rows={1} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="surface-card p-3"
            >
              <p className="text-h3 font-semibold tabular-nums text-primary">{kpi.value}</p>
              <p className="text-caption text-muted-foreground">{kpi.label}</p>
              {kpi.sub && <p className="mt-0.5 text-hint">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
