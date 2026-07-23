"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useCreateDeck, useDeckFormats } from "@/hooks/useDeck";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters/tournament-games";
import type { DeckFormat } from "@/types/deck";

type CatalogGame = {
  id: string;
  game_code: string;
  slug: string;
  display_name: string;
};

export default function NovoDeckPage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth("/decks/novo");
  const createDeck = useCreateDeck();
  const [name, setName] = useState("");
  const [game, setGame] = useState("mtg");
  const [format, setFormat] = useState("standard");

  const { data: catalogGames = [] } = useQuery({
    queryKey: ["catalog-games-new-deck"],
    queryFn: async () => {
      const res = await fetch("/api/games", { cache: "no-store" });
      if (!res.ok) return [] as CatalogGame[];
      const data = (await res.json()) as { games: CatalogGame[] };
      return data.games ?? [];
    },
  });
  const { data: formats = [] } = useDeckFormats(game);

  useEffect(() => {
    if (formats.length > 0) setFormat(formats[0].slug);
  }, [formats]);

  if (loading || !user) {
    return (
      <MobileLayout>
        <main className="container mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </main>
      </MobileLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const gameRow = catalogGames.find((g) => g.slug === game || g.game_code.toLowerCase() === game);
    const formatRow = formats.find((f) => f.slug === format) as DeckFormat | undefined;
    const deck = await createDeck.mutateAsync({
      name: name.trim(),
      game,
      game_id: gameRow?.id,
      format,
      format_id: formatRow?.id,
    });
    router.push(`/decks/${deck.id}/build`);
  };

  return (
    <MobileLayout>
      <main className="container mx-auto max-w-md px-4 py-16">
        <Link href="/decks" className="text-sm text-muted-foreground">
          ← Meus decks
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Criar novo deck</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Nome do deck</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 border-border bg-card"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Jogo</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {TOURNAMENT_GAMES.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Formato</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {formats.length > 0 ? (
                formats.map((f) => (
                  <option key={f.id} value={f.slug}>
                    {f.display_name}
                  </option>
                ))
              ) : (
                <>
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="commander">Commander</option>
                  <option value="free">Livre</option>
                </>
              )}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={createDeck.isPending}>
            {createDeck.isPending ? "Criando…" : "Criar e abrir builder"}
          </Button>
        </form>
      </main>
    </MobileLayout>
  );
}
