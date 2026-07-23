"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useGamePortal } from "@/components/experience/GameProvider";
import {
  fetchPublicDecks,
  fetchPublicEvents,
  fetchRecentSets,
  fetchTopMovers,
} from "@/lib/live-data/fetchers";
import { gameCardsPath, gameSetPath } from "@/lib/game-routes";
import { setCanonicalSlug } from "@/lib/set-slug";

/**
 * Portal vivo por jogo — meta, torneios, decks, staples, expansões.
 */
export function PortalLiveBlocks() {
  const { gameId, slug, theme } = useGamePortal();

  const decksQ = useQuery({
    queryKey: ["portal-live-decks", gameId],
    queryFn: () => fetchPublicDecks(6, gameId),
    staleTime: 60_000,
  });
  const setsQ = useQuery({
    queryKey: ["portal-live-sets", gameId],
    queryFn: () => fetchRecentSets(gameId, 6),
    staleTime: 120_000,
  });
  const moversQ = useQuery({
    queryKey: ["portal-live-movers", gameId],
    queryFn: () => fetchTopMovers(6),
    staleTime: 60_000,
  });
  const eventsQ = useQuery({
    queryKey: ["portal-live-events", gameId],
    queryFn: () => fetchPublicEvents(6),
    staleTime: 60_000,
  });

  const staples = (moversQ.data?.gainers ?? [])
    .filter((m) => !m.game || String(m.game).toUpperCase() === gameId)
    .slice(0, 6);

  return (
    <section className="portal-section container mx-auto max-w-6xl px-4 py-12" data-testid="portal-live-blocks">
      <h2 className="portal-section-title mb-6 text-xl md:text-2xl">Ao vivo em {theme.name}</h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <LiveColumn title="Decks recentes" href={`/decks?game=${encodeURIComponent(gameId)}`}>
          {(decksQ.data ?? []).map((d) => (
            <Link key={d.id} href={`/decks/${d.id}`} className="portal-link block truncate text-sm hover:underline">
              {d.name || d.title || "Deck"}
            </Link>
          ))}
          {!decksQ.isLoading && !(decksQ.data ?? []).length && (
            <p className="text-sm text-[color:var(--game-text-muted)]">Aguardando decks públicos</p>
          )}
        </LiveColumn>

        <LiveColumn title="Preço das staples" href="/loja/tendencias">
          {staples.map((m, i) => (
            <Link
              key={m.card_id || m.id || i}
              href={
                m.card_id || m.id
                  ? `${gameCardsPath(slug)}/${encodeURIComponent(m.card_id || m.id!)}`
                  : "/loja/tendencias"
              }
              className="flex justify-between gap-2 text-sm text-[color:var(--game-text)] hover:text-[color:var(--game-accent)]"
            >
              <span className="truncate">{m.name || "Staple"}</span>
              <span className="shrink-0 text-[color:var(--game-accent)]">
                {m.change_pct != null ? `${m.change_pct > 0 ? "+" : ""}${m.change_pct.toFixed(1)}%` : "→"}
              </span>
            </Link>
          ))}
          {!staples.length && (
            <p className="text-sm text-[color:var(--game-text-muted)]">Movers em sincronização</p>
          )}
        </LiveColumn>

        <LiveColumn title="Expansões" href={`/${slug}/expansions`}>
          {(setsQ.data ?? []).map((s) => (
            <Link
              key={s.code}
              href={gameSetPath(slug, setCanonicalSlug(s))}
              className="block truncate text-sm text-[color:var(--game-text)] hover:text-[color:var(--game-accent)]"
            >
              <span className="mr-2 font-mono text-xs text-[color:var(--game-text-muted)]">{s.code}</span>
              {s.name}
            </Link>
          ))}
        </LiveColumn>

        <LiveColumn title="Eventos & ranking" href="/torneio">
          {(eventsQ.data ?? []).slice(0, 4).map((e) => (
            <Link
              key={e.id}
              href={`/tournament/${e.id}`}
              className="block truncate text-sm text-[color:var(--game-text)] hover:text-[color:var(--game-accent)]"
            >
              {e.name || e.title || "Evento"}
            </Link>
          ))}
          <Link href="/leaderboard" className="portal-link mt-2 inline-flex text-xs hover:underline">
            Ranking / Top players →
          </Link>
          <Link href="/torneio" className="portal-link mt-1 inline-flex text-xs hover:underline">
            Calendário completo →
          </Link>
        </LiveColumn>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {["Standard", "Commander", "Modern"].map((fmt) => (
          <Link
            key={fmt}
            href={`/decks?game=${encodeURIComponent(gameId)}&format=${encodeURIComponent(fmt.toLowerCase())}`}
            className="large-visual-card block p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--game-accent)]">
              Meta
            </p>
            <p className="mt-1 font-semibold text-[color:var(--game-text)]">{fmt}</p>
            <p className="mt-1 text-xs text-[color:var(--game-text-muted)]">
              Decks e resultados · {theme.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function LiveColumn({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[color:var(--game-text)]">{title}</h3>
        <Link href={href} className="portal-link text-xs hover:underline">
          Ver
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
