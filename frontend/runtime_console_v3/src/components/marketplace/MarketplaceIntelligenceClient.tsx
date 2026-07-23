"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { fetchTopMovers } from "@/lib/live-data/fetchers";

type CardIntel = {
  avg?: number;
  min?: number;
  max?: number;
  liquidity?: string;
  listed?: number;
  velocity?: string;
  competition?: string;
  best_offer?: string;
  score?: number;
  seller_tip?: string;
  buyer_tip?: string;
};

/**
 * Marketplace Intelligence — páginas ricas sem duplicar Pricing BC.
 */
export function MarketplaceIntelligenceClient({ cardId }: { cardId?: string }) {
  const enabled = isFeatureEnabled("MARKETPLACE_INTELLIGENCE");
  const moversQ = useQuery({
    queryKey: ["mkt-intel-movers"],
    queryFn: () => fetchTopMovers(6),
    enabled,
    staleTime: 60_000,
  });
  const detailQ = useQuery({
    queryKey: ["mkt-intel-card", cardId],
    queryFn: async (): Promise<CardIntel> => {
      if (!cardId) return {};
      try {
        const res = await fetch(
          `/api/catalog/cards/${encodeURIComponent(cardId)}/intelligence`,
          { cache: "no-store" },
        );
        if (!res.ok) return {};
        return (await res.json()) as CardIntel;
      } catch {
        return {};
      }
    },
    enabled: enabled && Boolean(cardId),
    staleTime: 60_000,
  });

  if (!enabled) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Marketplace Intelligence desabilitado.</p>
        </div>
      </MobileLayout>
    );
  }

  const d = detailQ.data ?? {};
  const metrics = [
    { label: "Preço médio", value: d.avg != null ? `R$ ${d.avg}` : "—" },
    { label: "Mínimo", value: d.min != null ? `R$ ${d.min}` : "—" },
    { label: "Máximo", value: d.max != null ? `R$ ${d.max}` : "—" },
    { label: "Liquidez", value: d.liquidity ?? "—" },
    { label: "Anunciadas", value: d.listed ?? "—" },
    { label: "Velocidade", value: d.velocity ?? "—" },
    { label: "Competição", value: d.competition ?? "—" },
    { label: "Melhor oferta", value: d.best_offer ?? "—" },
    { label: "Marketplace Score", value: d.score ?? "—" },
  ];

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Marketplace Intelligence" },
          ]}
        />
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Marketplace Intelligence</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Preço, liquidez, competição e sugestões — Catalog + Pricing + Analytics públicos.
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <li key={m.label} className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-lg font-semibold">{String(m.value)}</p>
            </li>
          ))}
        </ul>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h2 className="font-semibold">Sugestão para vendedor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {d.seller_tip || "Ajuste preço pela média e liquidez — veja inteligência do painel."}
            </p>
            <Link
              href="/vendedor/painel/estatisticas/inteligencia"
              className="mt-3 inline-flex text-sm text-primary hover:underline"
            >
              Painel vendedor →
            </Link>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h2 className="font-semibold">Sugestão para comprador</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {d.buyer_tip || "Compare melhor oferta e movers antes de comprar."}
            </p>
            <Link href="/loja/tendencias" className="mt-3 inline-flex text-sm text-primary hover:underline">
              Tendências →
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Histórico · movers</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...(moversQ.data?.gainers ?? []), ...(moversQ.data?.losers ?? [])]
              .slice(0, 8)
              .map((m, i) => (
                <li key={m.card_id || m.id || i}>
                  <Link
                    href={
                      m.card_id || m.id
                        ? `/cards/${encodeURIComponent(m.card_id || m.id!)}`
                        : "/loja/tendencias"
                    }
                    className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{m.name || "Carta"}</span>
                    <span className="text-muted-foreground">
                      {m.change_pct != null ? `${m.change_pct.toFixed(1)}%` : "—"}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </MobileLayout>
  );
}
