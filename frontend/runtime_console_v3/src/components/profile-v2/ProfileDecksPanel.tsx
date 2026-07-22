"use client";

import Link from "next/link";
import { useMyDecks } from "@/hooks/useDeck";
import { formatCurrency } from "@/lib/format-currency";
import { publicProfilePath, slugifyDeckName } from "@/lib/profile-v2";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileDecksPanel() {
  const { data: decks = [], isLoading, isError } = useMyDecks();
  const { data: profile } = usePlayerProfile("me");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">Não foi possível carregar decks.</p>
    );
  }

  const publicDecks = decks.filter((d) => d.is_public);
  const privateDecks = decks.filter((d) => !d.is_public);

  return (
    <div className="space-y-6" data-testid="profile-decks-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Decks</h1>
        <p className="text-small text-muted-foreground">
          Consome Deck Workspace via API pública.{" "}
          <Link href="/decks" className="text-primary hover:underline">
            Abrir lista
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-4 text-small text-muted-foreground">
        <span>Meus decks: {decks.length}</span>
        <span>Públicos: {publicDecks.length}</span>
        <span>Privados: {privateDecks.length}</span>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum deck ainda.</p>
          <Link href="/decks/novo" className="mt-3 inline-block text-primary hover:underline">
            Criar deck
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {decks.map((deck) => {
            const publicHref =
              profile?.handle && deck.is_public
                ? publicProfilePath(
                    profile.handle,
                    `decks/${slugifyDeckName(deck.name)}`,
                  )
                : null;
            return (
              <li key={deck.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/decks/${deck.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {deck.name}
                  </Link>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    {deck.format || "—"} · {deck.is_public ? "Público" : "Privado"}
                    {deck.updated_at
                      ? ` · Editado ${new Date(deck.updated_at).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-small">
                  <span>{formatCurrency(deck.total_price ?? 0, "BRL")}</span>
                  <span className="text-muted-foreground">{deck.total_cards} cartas</span>
                  {publicHref ? (
                    <Link href={publicHref} className="text-primary hover:underline">
                      URL amigável
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
