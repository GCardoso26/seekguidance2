"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicDecks, fetchPublicEvents } from "@/lib/live-data/fetchers";

type Props = {
  deckId: string;
  gameId?: string;
  deckName?: string;
};

/**
 * Deck Workspace — decks semelhantes, meta, torneios.
 */
export function DeckLivePanels({ deckId, gameId, deckName }: Props) {
  const similarQ = useQuery({
    queryKey: ["deck-live-similar", gameId, deckId],
    queryFn: () => fetchPublicDecks(6, gameId),
    staleTime: 60_000,
  });
  const eventsQ = useQuery({
    queryKey: ["deck-live-events"],
    queryFn: () => fetchPublicEvents(4),
    staleTime: 60_000,
  });

  const similar = (similarQ.data ?? []).filter((d) => d.id !== deckId).slice(0, 5);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/30 p-4" data-testid="deck-live-panels">
      <h2 className="text-base font-semibold text-foreground">Ao vivo no workspace</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Decks semelhantes
          </h3>
          <ul className="mt-2 space-y-1">
            {similar.map((d) => (
              <li key={d.id}>
                <Link href={`/decks/${d.id}`} className="text-sm text-primary hover:underline">
                  {d.name || d.title || "Deck"}
                </Link>
              </li>
            ))}
            {!similar.length && (
              <li className="text-sm text-muted-foreground">Explore mais decks públicos</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Meta atual
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare {deckName || "este deck"} com publicações recentes e tendências do formato.
          </p>
          <Link href="/loja/tendencias" className="mt-2 inline-flex text-sm text-primary hover:underline">
            Ver meta / movers →
          </Link>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Últimos torneios
          </h3>
          <ul className="mt-2 space-y-1">
            {(eventsQ.data ?? []).map((e) => (
              <li key={e.id}>
                <Link href={`/tournament/${e.id}`} className="text-sm text-primary hover:underline">
                  {e.name || e.title || "Evento"}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/torneio" className="mt-2 inline-flex text-sm text-primary hover:underline">
            Tournament Hub →
          </Link>
        </div>
      </div>
    </section>
  );
}
