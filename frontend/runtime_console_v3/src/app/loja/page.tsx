import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
  asHealth,
  buildStoreGames,
  GameGridBootstrap,
  GameGridStream,
} from "@/components/games/GameGridRsc";
import { LojaHeroGallery } from "@/components/loja/LojaHeroGallery";
import { fetchCatalogHealth } from "@/lib/seo-metadata";

async function LojaHeroStream() {
  const raw = await fetchCatalogHealth();
  const health = asHealth(raw);
  const games = buildStoreGames(health);
  return (
    <LojaHeroGallery
      totalCards={health.total_cards}
      gameCount={games.length}
    />
  );
}

export default function LojaPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<LojaHeroGallery />}>
        <LojaHeroStream />
      </Suspense>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<GameGridBootstrap />}>
          <GameGridStream />
        </Suspense>
      </div>
    </MobileLayout>
  );
}
