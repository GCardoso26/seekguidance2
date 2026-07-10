"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameGrid } from "@/components/games/GameGrid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InlineAlert } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";

function LojaPageContent() {
  const searchParams = useSearchParams();
  const fromMarketplace = searchParams.get("from") === "marketplace";

  return (
    <MobileLayout>
      <div className="border-b border-border bg-gradient-to-b from-luxury-gold/5 to-transparent">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <Breadcrumbs
            className="mb-4 text-muted-foreground"
            items={[{ label: "Início", href: "/" }, { label: "Loja" }]}
          />
          {fromMarketplace && (
            <InlineAlert
              className="mb-4"
              tone="info"
              message="O hub de compras de singles TCG é a Loja. Produtos selados e decklists continuam em Produtos selados."
            />
          )}
          <h1 className="text-3xl font-bold text-foreground">Marketplace TCG</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Singles, boosters, decks e acessórios — navegue por jogo e categoria como no CardTrader,
            com a identidade Judge TCG.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/loja/busca">Buscar singles</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15">
              <Link href="/marketplace/produtos">Produtos selados</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Escolha seu jogo</h2>
        <GameGrid />
      </div>
    </MobileLayout>
  );
}

export default function LojaPage() {
  return (
    <Suspense fallback={null}>
      <LojaPageContent />
    </Suspense>
  );
}
