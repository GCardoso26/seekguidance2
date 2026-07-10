"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameHubPanel } from "@/components/games/GameHubPanel";
import { GameHubSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { gameIdFromSlug } from "@/lib/tcg-tokens";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { usePagePerformance } from "@/hooks/usePagePerformance";

function GameHubContent() {
  const params = useParams();
  const slug = String(params.game ?? params.gameSlug ?? "");
  const gameId = gameIdFromSlug(slug);
  const { data: health, isLoading: healthLoading } = useCatalogHealth();
  usePagePerformance(`loja/${slug}`);

  if (!gameId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Jogo não encontrado</h1>
        <Button asChild className="mt-6">
          <Link href="/loja">Ver todos os jogos</Link>
        </Button>
      </div>
    );
  }

  const cardCount = health?.by_game?.[gameId] ?? 0;

  return (
    <GameHubPanel
      gameId={gameId}
      slug={slug}
      cardCount={cardCount}
      healthLoading={healthLoading}
    />
  );
}

export default function GameHubPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<GameHubSkeleton />}>
        <GameHubContent />
      </Suspense>
    </MobileLayout>
  );
}
