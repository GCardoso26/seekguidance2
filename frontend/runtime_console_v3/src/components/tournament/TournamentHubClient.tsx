"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicEvents } from "@/lib/live-data/fetchers";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

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

/**
 * Tournament Hub — índice vivo (APIs tournament + tournament-platform).
 */
export function TournamentHubClient() {
  const eventsQ = useQuery({
    queryKey: ["tournament-hub-events"],
    queryFn: () => fetchPublicEvents(12),
    staleTime: 60_000,
  });
  const tournamentsQ = useQuery({
    queryKey: ["tournament-hub-list"],
    queryFn: fetchTournaments,
    staleTime: 60_000,
  });

  const upcoming = eventsQ.data ?? [];
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
          <h2 className="text-lg font-semibold">Próximos eventos</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/tournament/${e.id}`}
                  className="block rounded-xl border border-border bg-card/40 p-4 transition hover:border-primary/40"
                >
                  <p className="font-medium">{e.name || e.title || "Evento"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.starts_at
                      ? new Date(e.starts_at).toLocaleString("pt-BR")
                      : e.status || "Agendado"}
                  </p>
                </Link>
              </li>
            ))}
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
