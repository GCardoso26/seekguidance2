"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PortalSections } from "@/components/experience/PortalSections";
import { PortalLayout } from "@/components/experience/PortalLayout";
import { useGamePortalOptional } from "@/components/experience/GameProvider";
import { GameHubSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { gameIdFromSlug } from "@/lib/tcg-tokens";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { usePagePerformance } from "@/hooks/usePagePerformance";

function GameHubContent() {
  const params = useParams();
  const slug = String(params.game ?? params.gameSlug ?? "");
  const gameId = gameIdFromSlug(slug);
  const portal = useGamePortalOptional();
  const { data: health, isLoading: healthLoading } = useCatalogHealth();
  usePagePerformance(`portal/${slug}`);

  if (!gameId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Jogo não encontrado</h1>
        <Button asChild className="mt-6">
          <Link href="/">Ver todos os universos</Link>
        </Button>
      </div>
    );
  }

  const cardCount = health?.by_game?.[gameId] ?? 0;
  const sections = (
    <PortalSections cardCount={cardCount} healthLoading={healthLoading} />
  );

  // Canonical `/{slug}` already wraps PortalLayout; legacy `/loja/{game}` does not.
  if (portal) return sections;
  return (
    <PortalLayout gameId={gameId} slug={slug}>
      {sections}
    </PortalLayout>
  );
}

export default function GameHubPage() {
  return (
    <Suspense fallback={<GameHubSkeleton />}>
      <GameHubContent />
    </Suspense>
  );
}
