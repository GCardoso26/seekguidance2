"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { TrustBadge } from "@/components/seller-reputation/TrustBadge";
import type { ReputationOverview } from "@/types/seller-reputation";

type Props = {
  reputation?: ReputationOverview | null;
};

export function ReputationOverviewWidget({ reputation }: Props) {
  if (!reputation) {
    return <div className="h-16 animate-pulse rounded-xl bg-muted/50" />;
  }

  return (
    <section className="surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reputação</h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{reputation.trust_score.toFixed(1)}</p>
          <TrustBadge
            level={reputation.seller_level}
            badges={reputation.badges}
            trustScore={reputation.trust_score}
            compact
          />
        </div>
        {reputation.alerts_count > 0 && (
          <Link
            href="/vendedor/painel/reputacao"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-warning hover:bg-amber-500/15"
          >
            <AlertTriangle className="h-4 w-4" />
            {reputation.alerts_count} alerta(s)
          </Link>
        )}
      </div>
    </section>
  );
}
