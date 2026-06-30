"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameGrid } from "@/components/games/GameGrid";
import { Button } from "@/components/ui/button";

export default function LojaPage() {
  return (
    <MobileLayout>
      <div className="border-b border-white/10 bg-gradient-to-b from-luxury-gold/5 to-transparent">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold text-luxury-frost">Marketplace TCG</h1>
          <p className="mt-2 max-w-2xl text-luxury-mist">
            Singles, boosters, decks e acessórios — navegue por jogo e categoria como no CardTrader,
            com a identidade Judge TCG.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold/90">
              <Link href="/loja/busca">Buscar singles</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15">
              <Link href="/marketplace">Produtos selados</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-luxury-frost">Escolha seu jogo</h2>
        <GameGrid />
      </div>
    </MobileLayout>
  );
}
