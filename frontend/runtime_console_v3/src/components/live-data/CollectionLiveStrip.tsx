"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCollectionInsights } from "@/lib/live-data/fetchers";
import { formatCurrency } from "@/lib/format-currency";

/**
 * Collection viva — aquisições, valorização, altas/quedas, alertas.
 */
export function CollectionLiveStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ["collection-live-insights"],
    queryFn: fetchCollectionInsights,
    staleTime: 60_000,
  });

  if (isLoading && !data) {
    return (
      <div className="h-24 animate-pulse rounded-xl bg-muted/40" data-testid="collection-live-loading" />
    );
  }

  const cards = [
    {
      label: "Valor da coleção",
      value:
        data?.totalValue != null
          ? formatCurrency(data.totalValue, "BRL")
          : "—",
      href: "/colecao",
    },
    {
      label: "Hoje",
      value:
        data?.valueChangeToday != null
          ? `${data.valueChangeToday >= 0 ? "+" : ""}${formatCurrency(Math.abs(data.valueChangeToday), "BRL")}`
          : "—",
      href: "/colecao",
    },
    {
      label: "Maior alta",
      value: data?.topGainer?.name
        ? `${data.topGainer.name}${data.topGainer.changePct != null ? ` (${data.topGainer.changePct > 0 ? "+" : ""}${data.topGainer.changePct.toFixed(1)}%)` : ""}`
        : "—",
      href: "/loja/tendencias",
    },
    {
      label: "Maior queda",
      value: data?.topLoser?.name
        ? `${data.topLoser.name}${data.topLoser.changePct != null ? ` (${data.topLoser.changePct.toFixed(1)}%)` : ""}`
        : "—",
      href: "/loja/tendencias",
    },
    {
      label: "Progresso",
      value: data?.completionPct != null ? `${Math.round(data.completionPct)}%` : "—",
      href: "/colecao/faltantes",
    },
    {
      label: "Alertas",
      value: "Inteligentes",
      href: "/colecao/alertas",
    },
  ];

  return (
    <section className="mb-6" data-testid="collection-live-strip">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">Coleção ao vivo</h2>
        <Link href="/colecao/alertas" className="text-xs text-primary hover:underline">
          Alertas →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className="block rounded-xl border border-border bg-card/50 p-3 transition hover:border-primary/40"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{c.value}</p>
            </Link>
          </li>
        ))}
      </ul>
      {(data?.recentAcquisitions ?? []).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-foreground">Últimas aquisições</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {data!.recentAcquisitions!.slice(0, 6).map((a, i) => (
              <li
                key={a.id || i}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {a.name || "Carta"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
