"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameGrid } from "@/components/games/GameGrid";
import { Button } from "@/components/ui/button";

export default function LojaPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de TCGs</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha seu jogo e explore o catálogo completo com busca facetada e preços.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/loja/busca">Buscar em todos os jogos</Link>
          </Button>
        </div>
        <GameGrid />
      </div>
    </MobileLayout>
  );
}
