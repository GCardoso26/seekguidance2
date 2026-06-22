"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useCreateDeck } from "@/hooks/useDeck";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";

export default function NovoDeckPage() {
  const router = useRouter();
  const { user, loading } = useJudgeAuth();
  const createDeck = useCreateDeck();
  const [name, setName] = useState("");
  const [game, setGame] = useState("mtg");
  const [format, setFormat] = useState("standard");

  if (!loading && !user) {
    router.push("/login?next=/decks/novo");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const deck = await createDeck.mutateAsync({ name: name.trim(), game, format });
    router.push(`/decks/${deck.id}/build`);
  };

  return (
    <MobileLayout>
      <main className="container mx-auto max-w-md px-4 py-16">
        <Link href="/decks" className="text-sm text-luxury-mist">
          ← Meus decks
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-luxury-frost">Criar novo deck</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Nome do deck</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 border-white/10 bg-luxury-obsidian"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Jogo</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-luxury-obsidian px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-md border border-white/10 bg-luxury-obsidian px-3 py-2 text-sm"
            >
              <option value="standard">Standard</option>
              <option value="modern">Modern</option>
              <option value="commander">Commander</option>
              <option value="free">Livre</option>
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
