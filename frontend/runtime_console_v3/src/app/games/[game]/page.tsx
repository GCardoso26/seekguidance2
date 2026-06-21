"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { FacetedSearch } from "@/components/search/FacetedSearch";
import { CatalogSearchSkeleton } from "@/components/search/CatalogSearchSkeleton";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import Image from "next/image";

function GamePageContent() {
  const params = useParams();
  const slug = String(params.game ?? "");
  const gameId = gameIdFromSlug(slug);

  if (!gameId) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Jogo não encontrado</h1>
          <Button asChild className="mt-6">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const token = GAME_TOKENS[gameId as GameId];

  return (
    <MobileLayout>
      <section
        className="border-b border-border/40 py-10"
        style={{ backgroundColor: `${token.primary}10` }}
      >
        <div className="container mx-auto px-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Início
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <Image src={token.logo} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: token.primary }}>
                {token.name}
              </h1>
              <p className="text-muted-foreground">Explore o catálogo completo de {token.name}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <FacetedSearch initialGame={gameId} />
      </div>
    </MobileLayout>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<CatalogSearchSkeleton />}>
      <GamePageContent />
    </Suspense>
  );
}
