"use client";

import Link from "next/link";
import { Shield, Truck, BadgeCheck, Clock, AlertTriangle } from "lucide-react";
import { useStoreReputation } from "@/hooks/useBuyerExperience";
import { TrustTierBadge } from "@/components/store/TrustTierBadge";

export function StoreReputationPanel({ slug }: { slug: string }) {
  const { data, isLoading, error } = useStoreReputation(slug);

  if (isLoading) {
    return <div className="mt-6 h-28 animate-pulse rounded-xl bg-muted/50" aria-busy="true" />;
  }
  if (error || !data) return null;

  const badges = data.badges ?? [];
  const trustTier = (data as { trust_tier?: { id: string; label: string; emoji?: string } }).trust_tier;
  const metrics = (data as { metrics?: { cancel_rate?: number | null; active_listings?: number } }).metrics;

  return (
    <section
      className="mt-6 surface-card p-4"
      data-testid="store-reputation-panel"
      aria-label="Reputação da loja"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <span className="text-lg font-bold text-primary">{Math.round(data.trust_score)}</span>
        </div>
        <div>
          <h2 className="flex flex-wrap items-center gap-2 font-semibold">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            Trust Score
            <TrustTierBadge tier={trustTier} />
          </h2>
          <p className="text-sm capitalize text-muted-foreground">
            Nível {data.seller_level} · {data.orders_completed} pedidos concluídos
            {metrics?.cancel_rate != null
              ? ` · cancelamentos ${(metrics.cancel_rate * 100).toFixed(1)}%`
              : ""}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/60 p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="h-3 w-3" aria-hidden /> Tempo médio envio
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {data.avg_shipping_hours != null ? `${Math.round(data.avg_shipping_hours)}h` : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> Tempo resposta
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {data.response_time_hours != null ? `${Math.round(data.response_time_hours)}h` : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" aria-hidden /> Chargebacks
          </dt>
          <dd className="mt-1 text-sm font-medium">{data.chargebacks_open}</dd>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3 w-3" aria-hidden /> Avaliações
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {data.reputation.review_avg.toFixed(1)} ({data.reputation.review_count})
          </dd>
        </div>
      </dl>

      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-caption uppercase tracking-wide text-primary"
            >
              {b.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-caption text-muted-foreground/80">
        {data.history_hint ?? "Dados do Reputation Engine."}{" "}
        <Link href={`/marketplace/loja/${slug}`} className="text-primary hover:underline">
          Atualizar
        </Link>
      </p>
    </section>
  );
}
