"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadJudgeFavorites } from "@/lib/judge-favorites";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { useMyDecks } from "@/hooks/useDeck";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileFavoritesPanel() {
  const [judgeFavs, setJudgeFavs] = useState<ReturnType<typeof loadJudgeFavorites>>([]);
  const [ready, setReady] = useState(false);
  const buyer = useBuyerDashboard();
  const decks = useMyDecks();

  useEffect(() => {
    setJudgeFavs(loadJudgeFavorites());
    setReady(true);
  }, []);

  if (!ready || buyer.isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const stores = buyer.data?.favorite_stores ?? [];
  const publicDecks = (decks.data ?? []).filter((d) => d.is_public).slice(0, 6);

  return (
    <div className="space-y-8" data-testid="profile-favorites-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Favoritos</h1>
        <p className="text-small text-muted-foreground">
          Cartas (judge favorites), decks públicos, produtos e lojas via APIs / storage local.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Cartas</h2>
        {judgeFavs.length === 0 ? (
          <p className="text-small text-muted-foreground">Nenhuma carta favorita.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {judgeFavs.slice(0, 10).map((f) => (
              <li key={f.id} className="px-4 py-2 text-sm">
                {String((f as { name?: string }).name ?? f.id)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Decks</h2>
        {publicDecks.length === 0 ? (
          <p className="text-small text-muted-foreground">
            Sem decks públicos.{" "}
            <Link href="/decks" className="text-primary hover:underline">
              Meus decks
            </Link>
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {publicDecks.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/decks/${d.id}`}
                  className="rounded-md border border-border px-2.5 py-1 text-small hover:border-primary/40"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Lojas</h2>
        {stores.length === 0 ? (
          <p className="text-small text-muted-foreground">Nenhuma loja favorita ainda.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {stores.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/loja/${s.slug}`}
                  className="rounded-md border border-border px-2.5 py-1 text-small hover:border-primary/40"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Produtos</h2>
        <p className="text-small text-muted-foreground">
          Produtos favoritos aparecem na{" "}
          <Link href="/perfil/wishlist" className="text-primary hover:underline">
            wishlist
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
