"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { useMyDecks } from "@/hooks/useDeck";
import { useGamificationProfile } from "@/hooks/useGamification";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { formatCurrency } from "@/lib/format-currency";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileStatsPanel() {
  const profile = usePlayerProfile("me");
  const buyer = useBuyerDashboard();
  const collection = useCollectionInsights();
  const decks = useMyDecks();
  const game = useGamificationProfile();

  const favoriteFormat = useMemo(() => {
    const list = decks.data ?? [];
    if (!list.length) return null;
    const counts = new Map<string, number>();
    for (const d of list) {
      const key = d.format || "—";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [decks.data]);

  const favoriteExpansion = useMemo(() => {
    const sets = collection.data?.bySet ?? [];
    if (!sets.length) return null;
    return [...sets].sort((a, b) => (b.ownedUnique ?? 0) - (a.ownedUnique ?? 0))[0]?.setName
      ?? null;
  }, [collection.data]);

  if (buyer.isLoading || collection.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const games = [
    ...(profile.data?.favoriteGame ? [profile.data.favoriteGame] : []),
    ...(profile.data?.favoriteTcgs ?? []),
  ];

  return (
    <div className="space-y-6" data-testid="profile-stats-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Estatísticas</h1>
        <p className="text-small text-muted-foreground">
          Projeções via Analytics / Collection / Decks / Buyer (APIs públicas).
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileSummaryCard
          label="Jogos favoritos"
          value={games.length ? games.slice(0, 2).join(", ") : "—"}
        />
        <ProfileSummaryCard label="Formato favorito" value={favoriteFormat ?? "—"} />
        <ProfileSummaryCard
          label="Expansão favorita"
          value={typeof favoriteExpansion === "string" ? favoriteExpansion : "—"}
        />
        <ProfileSummaryCard
          label="Deck mais utilizado"
          value={
            [...(decks.data ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0]?.name ?? "—"
          }
          href="/perfil/decks"
        />
        <ProfileSummaryCard
          label="Cartas na coleção"
          value={String(collection.data?.uniqueCards ?? buyer.data?.collection.unique_cards ?? "—")}
          href="/colecao"
        />
        <ProfileSummaryCard
          label="Compras"
          value={String(buyer.data?.orders.total ?? game.data?.stats.purchases ?? "—")}
          href="/perfil/compras"
        />
        <ProfileSummaryCard
          label="Vendas"
          value={String(game.data?.stats.sales ?? "—")}
          href="/perfil/vendas"
        />
        <ProfileSummaryCard
          label="Economia"
          value={
            buyer.data
              ? formatCurrency((buyer.data.savings_cents ?? 0) / 100, "BRL")
              : "—"
          }
        />
        <ProfileSummaryCard
          label="Nível / XP"
          value={
            game.data
              ? `Nv. ${game.data.current_level} · ${game.data.total_xp} XP`
              : "—"
          }
          href="/perfil/conquistas"
        />
        <ProfileSummaryCard
          label="Dias consecutivos"
          value="—"
          hint="Placeholder Analytics — sem inventar horas"
        />
      </div>
      <p className="text-caption text-muted-foreground">
        Carta mais utilizada e horas na plataforma dependem de eventos Analytics; exibidos quando
        a projeção pública estiver disponível.{" "}
        <Link href="/colecao" className="text-primary hover:underline">
          Ver coleção
        </Link>
      </p>
    </div>
  );
}
