"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicEvents } from "@/lib/live-data/fetchers";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { TOURNAMENT_GAME_OPTIONS } from "@/lib/seller-tournament-form";
import { formatEventPriceBrl, normalizeStoreEvent } from "@/types/store-event";
import { distanceLabelFromCep } from "@/lib/geo/sp-distance";

async function fetchTournaments() {
  try {
    const res = await fetch("/api/tournament/tournaments?limit=20", { cache: "no-store" });
    if (!res.ok) return [] as Array<{ id: string; name?: string; status?: string; game?: string }>;
    const data = (await res.json()) as {
      tournaments?: Array<{ id: string; name?: string; status?: string; game?: string }>;
      items?: Array<{ id: string; name?: string; status?: string; game?: string }>;
    };
    return data.tournaments ?? data.items ?? [];
  } catch {
    return [];
  }
}

function EventDistance({ cep }: { cep: string | null }) {
  const q = useQuery({
    queryKey: ["event-distance-sp", cep],
    queryFn: () => distanceLabelFromCep(cep),
    enabled: Boolean(cep),
    staleTime: 24 * 60 * 60 * 1000,
  });
  if (!q.data) return null;
  return <span> · {q.data} do centro de SP</span>;
}

/**
 * Tournament Hub — índice vivo (APIs tournament + tournament-platform).
 */
export function TournamentHubClient() {
  const [gameFilter, setGameFilter] = useState("");

  const eventsQ = useQuery({
    queryKey: ["tournament-hub-events", gameFilter || "all"],
    queryFn: async () => {
      const raw = await fetchPublicEvents(24);
      return raw.map((e) => normalizeStoreEvent(e as unknown as Record<string, unknown>));
    },
    staleTime: 60_000,
  });
  const tournamentsQ = useQuery({
    queryKey: ["tournament-hub-list"],
    queryFn: fetchTournaments,
    staleTime: 60_000,
  });

  const upcoming = useMemo(() => {
    const list = eventsQ.data ?? [];
    if (!gameFilter) return list;
    return list.filter((e) => (e.game ?? "").toUpperCase() === gameFilter.toUpperCase());
  }, [eventsQ.data, gameFilter]);
  const list = tournamentsQ.data ?? [];

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-5xl space-y-10 px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tournament Hub" },
          ]}
        />
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Tournament Hub</h1>
          <p className="max-w-2xl text-muted-foreground">
            Próximos eventos, resultados, decklists e rankings — conectados a decks, cartas e
            marketplace.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/tournament/create"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Criar torneio
            </Link>
            <Link href="/comunidade/leaderboard" className="inline-flex min-h-10 items-center text-sm text-primary hover:underline">
              Rankings / Top players →
            </Link>
          </div>
        </header>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Próximos eventos</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="sr-only">Filtrar por jogo</span>
              <select
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                data-testid="hub-game-filter"
              >
                <option value="">Todos os jogos</option>
                {TOURNAMENT_GAME_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.map((e) => {
              const remaining = e.ticketsRemaining;
              const capacity = e.ticketsCapacity ?? e.capacity;
              const soldOut =
                remaining != null ? remaining <= 0 : false;
              return (
                <li key={e.id}>
                  <Link
                    href={`/search/torneios/${e.id}`}
                    className="flex gap-3 rounded-xl border border-border bg-card/40 p-4 transition hover:border-primary/40"
                    data-testid={`hub-event-${e.id}`}
                  >
                    {e.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.bannerUrl}
                        alt=""
                        className="h-[100px] w-[70px] shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-[100px] w-[70px] shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{e.name || "Evento"}</p>
                        {e.game && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {e.game}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {e.startsAt
                          ? new Date(e.startsAt).toLocaleString("pt-BR")
                          : e.status || "Agendado"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {e.storeName ? `${e.storeName} · ` : ""}
                        {e.addressCity && e.addressState
                          ? `${e.addressCity}/${e.addressState}`
                          : e.venue ?? "—"}
                        <EventDistance cep={e.addressCep} />
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="text-muted-foreground">{formatEventPriceBrl(e.priceCents)}</span>
                        {" · "}
                        {soldOut ? (
                          <span className="font-medium text-danger">Esgotado</span>
                        ) : remaining != null && capacity != null ? (
                          <span className="text-muted-foreground">
                            {remaining}/{capacity} vagas
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Vagas sob consulta</span>
                        )}
                        {e.status === "published" ? (
                          <span className="text-muted-foreground"> · Inscrições fechadas</span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
            {!eventsQ.isLoading && !upcoming.length && (
              <li className="text-sm text-muted-foreground">Nenhum evento público no momento.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Torneios & resultados</h2>
          <ul className="mt-4 space-y-2">
            {list.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tournament/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:border-primary/40"
                >
                  <span className="font-medium">{t.name || t.id}</span>
                  <span className="text-xs text-muted-foreground">{t.status || t.game || "—"}</span>
                </Link>
              </li>
            ))}
            {!tournamentsQ.isLoading && !list.length && (
              <li className="text-sm text-muted-foreground">
                Lista vazia — use criar torneio ou aguarde sincronização.
              </li>
            )}
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/decks", title: "Decks vencedores", sub: "Listas públicas" },
            { href: "/loja/busca", title: "Marketplace", sub: "Comprar staples do meta" },
            { href: "/comunidade/leaderboard", title: "Top 8 / Ranking", sub: "Jogadores em destaque" },
          ].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="rounded-xl border border-border p-4 transition hover:border-primary/40"
            >
              <p className="font-semibold">{x.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{x.sub}</p>
            </Link>
          ))}
        </section>
      </div>
    </MobileLayout>
  );
}
