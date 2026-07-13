"use client";

import { cn } from "@/lib/utils";
import type { DashboardAction } from "./types";

type Props = {
  actions: DashboardAction[];
  totals?: {
    active_products?: number;
    active_listings?: number;
    total_units?: number;
    value_cents?: number;
  };
  activeFilterId?: string | null;
  onActionClick: (action: DashboardAction) => void;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function InventoryDashboardStrip({
  actions,
  totals,
  activeFilterId,
  onActionClick,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "SKUs ativos",
            value: (totals?.active_products ?? 0) + (totals?.active_listings ?? 0),
          },
          { label: "Unidades", value: totals?.total_units ?? 0 },
          { label: "Valor em estoque", value: formatBRL(Number(totals?.value_cents ?? 0)) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.note}
            onClick={() => onActionClick(action)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              activeFilterId === action.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted/60",
            )}
          >
            <span className="font-medium">{action.label}</span>
            <span className="ml-2 text-muted-foreground">{action.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
