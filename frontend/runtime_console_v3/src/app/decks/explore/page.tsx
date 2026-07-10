"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { usePublicDecks } from "@/hooks/useDeck";
import { formatCurrency } from "@/lib/format-currency";

export default function ExploreDecksPage() {
  const { data: decks = [], isLoading } = usePublicDecks();

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/decks" className="text-sm text-muted-foreground">
          ← Meus decks
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Decks públicos</h1>

        <ul className="mt-6 space-y-3">
          {isLoading && <li className="text-sm text-muted-foreground">Carregando…</li>}
          {!isLoading && decks.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhum deck público ainda.</li>
          )}
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/decks/${deck.id}`}
                className="block surface-card p-4 hover:border-primary/30"
              >
                <p className="font-semibold text-foreground">{deck.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {deck.game} · {deck.format} · {deck.total_cards} cartas · {deck.likes} likes
                </p>
                <p className="text-xs text-primary">{formatCurrency(deck.total_price / 100)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
