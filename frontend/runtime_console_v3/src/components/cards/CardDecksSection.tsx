"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { usePublicDecks } from "@/hooks/useDeck";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UnifiedCard } from "@/types/card";

type Props = {
  card: UnifiedCard;
};

/**
 * Decks públicos do mesmo jogo — hub de descoberta universal (sem lógica por TCG).
 */
export function CardDecksSection({ card }: Props) {
  const game = String(card.game || "").toUpperCase();
  const { data: decks = [], isLoading, isError } = usePublicDecks(game || undefined);

  return (
    <section
      className="space-y-4"
      data-testid="card-decks-section"
      aria-labelledby="card-decks-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="card-decks-title" className="text-h3 text-foreground">
            Decks neste universo
          </h2>
          <p className="mt-1 text-small text-muted-foreground">
            Listas públicas do mesmo jogo — popularidade, community e ponto de partida.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/decks?add=${encodeURIComponent(card.id)}&game=${encodeURIComponent(game)}`}>
            <Layers className="mr-1.5 h-4 w-4" />
            Adicionar ao deck
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <p className="text-small text-muted-foreground">Não foi possível carregar decks públicos agora.</p>
      )}

      {!isLoading && !isError && decks.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-small text-muted-foreground">
          Ainda não há decks públicos neste jogo. Seja o primeiro a publicar.
        </p>
      )}

      {!isLoading && decks.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.slice(0, 6).map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/decks/${deck.id}`}
                className="block rounded-xl border border-border/80 bg-card/40 p-4 transition hover:border-[color:var(--game-accent,hsl(var(--primary)))] hover:bg-card/70"
              >
                <p className="truncate font-semibold text-foreground">{deck.name}</p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {deck.format}
                  {deck.owner?.display_name || deck.owner?.username
                    ? ` · ${deck.owner.display_name || deck.owner.username}`
                    : ""}
                </p>
                <dl className="mt-3 flex flex-wrap gap-3 text-caption text-muted-foreground">
                  <div>
                    <dt className="sr-only">Cartas</dt>
                    <dd>{deck.total_cards} cartas</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Views</dt>
                    <dd>{deck.views} views</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Likes</dt>
                    <dd>{deck.likes} likes</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
