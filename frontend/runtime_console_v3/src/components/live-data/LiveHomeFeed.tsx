"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  fetchBuyerRecommendations,
  fetchPublicDecks,
  fetchPublicEvents,
  fetchTopMovers,
  fetchTrends,
} from "@/lib/live-data/fetchers";
import { MarketplaceAssetSkeleton } from "@/components/assets/AssetSkeletons";
import { cn } from "@/lib/utils";

function Section({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-border py-8", className)}>
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-h2 font-semibold text-foreground">{title}</h2>
          {href ? (
            <Link href={href} className="text-sm text-primary hover:underline">
              Ver todos →
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function ChipList({
  items,
}: {
  items: Array<{ id: string; label: string; href: string; meta?: string }>;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Atualizando…</p>;
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="block rounded-xl border border-border/70 bg-card/40 px-4 py-3 transition hover:border-primary/40"
          >
            <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
            {item.meta ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Home V2 — blocos dinâmicos (Live Data Platform).
 * Consome apenas BFFs públicos existentes.
 */
export function LiveHomeFeed() {
  const { user } = useJudgeAuth();
  const decksQ = useQuery({
    queryKey: ["live-home-decks"],
    queryFn: () => fetchPublicDecks(8),
    staleTime: 60_000,
  });
  const moversQ = useQuery({
    queryKey: ["live-home-movers"],
    queryFn: () => fetchTopMovers(8),
    staleTime: 60_000,
  });
  const trendsQ = useQuery({
    queryKey: ["live-home-trends"],
    queryFn: () => fetchTrends(8),
    staleTime: 60_000,
  });
  const eventsQ = useQuery({
    queryKey: ["live-home-events"],
    queryFn: () => fetchPublicEvents(6),
    staleTime: 60_000,
  });
  const recsQ = useQuery({
    queryKey: ["live-home-recs"],
    queryFn: () => fetchBuyerRecommendations(8),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const loading = decksQ.isLoading && moversQ.isLoading;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <MarketplaceAssetSkeleton count={4} />
      </div>
    );
  }

  const decks = (decksQ.data ?? []).map((d) => ({
    id: d.id,
    label: d.name || d.title || "Deck",
    href: `/decks/${d.id}`,
    meta: d.likes != null ? `${d.likes} curtidas` : "Recém publicado",
  }));

  const gainers = (moversQ.data?.gainers ?? []).map((m, i) => ({
    id: m.card_id || m.id || `up-${i}`,
    label: m.name || "Carta",
    href: m.card_id || m.id ? `/cards/${encodeURIComponent(m.card_id || m.id!)}` : "/loja/tendencias",
    meta: m.change_pct != null ? `+${m.change_pct.toFixed(1)}%` : "Em alta",
  }));

  const losers = (moversQ.data?.losers ?? []).map((m, i) => ({
    id: m.card_id || m.id || `dn-${i}`,
    label: m.name || "Carta",
    href: m.card_id || m.id ? `/cards/${encodeURIComponent(m.card_id || m.id!)}` : "/loja/tendencias",
    meta: m.change_pct != null ? `${m.change_pct.toFixed(1)}%` : "Em queda",
  }));

  const desired = (trendsQ.data ?? []).map((m, i) => ({
    id: m.card_id || m.id || `tr-${i}`,
    label: m.name || "Tendência",
    href: m.card_id || m.id ? `/cards/${encodeURIComponent(m.card_id || m.id!)}` : "/loja/tendencias",
    meta: "Em destaque",
  }));

  const events = (eventsQ.data ?? []).map((e) => ({
    id: e.id,
    label: e.name || e.title || "Evento",
    href: `/tournament/${e.id}`,
    meta: e.starts_at ? new Date(e.starts_at).toLocaleDateString("pt-BR") : e.status || "Torneio",
  }));

  const liked = (recsQ.data?.you_may_like ?? []).map((r, i) => ({
    id: r.id || `rec-${i}`,
    label: r.name || "Recomendado",
    href: r.href || "/loja/busca",
    meta: r.reason || "Para você",
  }));

  return (
    <div data-testid="live-home-feed">
      <Section title="Últimos decks publicados" href="/decks">
        <ChipList items={decks} />
      </Section>
      <Section title="Meta da semana · cartas em alta" href="/loja/tendencias">
        <ChipList items={gainers} />
      </Section>
      <Section title="Preço caiu" href="/loja/tendencias">
        <ChipList items={losers} />
      </Section>
      <Section title="Mais desejadas / em tendência" href="/loja/tendencias">
        <ChipList items={desired} />
      </Section>
      <Section title="Eventos próximos" href="/torneio">
        <ChipList items={events} />
      </Section>
      <Section title="Produtos em destaque · para você" href="/loja/busca">
        <ChipList items={liked.length ? liked : desired} />
      </Section>
      <Section title="Novidades da plataforma" href="/comunidade">
        <ChipList
          items={[
            {
              id: "exp",
              label: "Expansões recentes",
              href: "/lorcana/expansions",
              meta: "Por universo",
            },
            {
              id: "social",
              label: "Feed da comunidade",
              href: "/social",
              meta: "Atividade ao vivo",
            },
            {
              id: "tournaments",
              label: "Tournament Hub",
              href: "/torneio",
              meta: "Resultados e calendário",
            },
            {
              id: "collection",
              label: "Sua coleção",
              href: "/colecao",
              meta: "Progresso e alertas",
            },
          ]}
        />
      </Section>
    </div>
  );
}
