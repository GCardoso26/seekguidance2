"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { GameHubSkeleton } from "@/components/ui/skeletons";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { usePagePerformance } from "@/hooks/usePagePerformance";

function GameHubContent() {
  const params = useParams();
  const slug = String(params.game ?? "");
  const gameId = gameIdFromSlug(slug);
  const { data: health, isLoading: healthLoading } = useCatalogHealth();
  usePagePerformance(`loja/${slug}`);

  if (!gameId) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Jogo não encontrado</h1>
          <Button asChild className="mt-6">
            <Link href="/loja">Ver todos os jogos</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const token = GAME_TOKENS[gameId as GameId];
  const cardCount = health?.by_game?.[gameId] ?? 0;

  return (
    <MobileLayout>
      <section
        className="border-b border-border/40 py-12"
        style={{ backgroundColor: `${token.primary}12` }}
      >
        <div className="container mx-auto px-4">
          <Link href="/loja" className="text-sm text-muted-foreground hover:text-foreground">
            ← Biblioteca de TCGs
          </Link>
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Image src={token.logo} alt="" width={80} height={80} className="h-20 w-20 object-contain" />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: token.primary }}>
                {token.name}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {healthLoading
                  ? "Carregando catálogo…"
                  : cardCount > 0
                    ? `${cardCount.toLocaleString("pt-BR")} cartas no catálogo`
                    : "Catálogo em sincronização"}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/loja/${slug}/busca`}>Buscar cartas</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/decks/novo">Montar deck</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <h2 className="text-lg font-semibold">Explorar</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/loja/${slug}/busca`}
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
          >
            <p className="font-medium">Catálogo completo</p>
            <p className="text-sm text-muted-foreground">Busca facetada por set, raridade e preço</p>
          </Link>
          <Link
            href="/loja/tendencias"
            className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
          >
            <p className="font-medium">Tendências</p>
            <p className="text-sm text-muted-foreground">Cartas em alta no marketplace</p>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<MobileLayout><GameHubSkeleton /></MobileLayout>}>
      <GameHubContent />
    </Suspense>
  );
}
