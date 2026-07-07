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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">Indicadores</h2>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                period === p.id ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10 text-luxury-mist hover:bg-white/15"
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
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
            >
              <p className="text-lg font-bold tabular-nums text-luxury-gold">{kpi.value}</p>
              <p className="text-xs text-luxury-mist">{kpi.label}</p>
              {kpi.sub && <p className="mt-0.5 text-[10px] text-luxury-mist/70">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
