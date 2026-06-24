"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Plus } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useCreateDeck, useMyDecks } from "@/hooks/useDeck";
import { DeckStatusBadge } from "@/components/deckbuilder/DeckStatusBadge";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";
import { DecksSkeleton } from "@/components/ui/skeletons";
import { formatCurrency } from "@/lib/format-currency";

export default function DecksPage() {
  const router = useRouter();
  const { user, loading } = useJudgeAuth();
  const { data: decks = [], isLoading } = useMyDecks();
  const createDeck = useCreateDeck();
  const [name, setName] = useState("");
  const [game, setGame] = useState("mtg");
  const [format, setFormat] = useState("standard");

  if (loading) {
    return (
      <MobileLayout>
        <DecksSkeleton />
      </MobileLayout>
    );
  }

  if (!user) {
    router.push("/entrar?next=/decks");
    return null;
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    const deck = await createDeck.mutateAsync({ name: name.trim(), game, format });
    router.push(`/decks/${deck.id}/build`);
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-luxury-frost">Meus decks</h1>
            <p className="text-sm text-luxury-mist">Crie, edite e publique seus decks</p>
          </div>
          <Link href="/decks/explore" className="text-sm text-luxury-gold">
            Explorar públicos
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-luxury-frost">
            <Plus className="h-4 w-4" />
            Novo deck
          </h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do deck"
              className="md:col-span-2 border-white/10 bg-luxury-obsidian"
            />
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="rounded-md border border-white/10 bg-luxury-obsidian px-3 py-2 text-sm"
            >
              {TOURNAMENT_GAMES.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="rounded-md border border-white/10 bg-luxury-obsidian px-3 py-2 text-sm"
            >
              <option value="standard">Standard</option>
              <option value="modern">Modern</option>
              <option value="commander">Commander</option>
              <option value="free">Livre</option>
            </select>
          </div>
          <Button className="mt-3" onClick={handleCreate} disabled={createDeck.isPending || !name.trim()}>
            Criar e abrir builder
          </Button>
        </div>

        <ul className="mt-6 space-y-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
            ))}
          {!isLoading && decks.length === 0 && (
            <li className="text-sm text-luxury-mist">Você ainda não tem decks.</li>
          )}
          {decks.map((deck) => (
            <li key={deck.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/decks/${deck.id}`} className="font-semibold text-luxury-frost hover:text-luxury-gold">
                    {deck.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <DeckStatusBadge deck={deck} />
                    <p className="text-xs capitalize text-luxury-mist">
                      {deck.game} · {deck.format} · {deck.total_cards} cartas
                    </p>
                  </div>
                  <p className="text-xs text-luxury-gold">{formatCurrency(deck.total_price / 100)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/decks/${deck.id}/build`}>
                    <Button size="sm" variant="outline">
                      <Layers className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
