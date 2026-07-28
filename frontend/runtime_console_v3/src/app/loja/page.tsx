import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { GameGridBootstrap, GameGridStream } from "@/components/games/GameGridRsc";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { LojaMarketplaceAlert } from "@/app/loja/LojaMarketplaceAlert";

export default function LojaPage() {
  return (
    <MobileLayout>
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <Breadcrumbs
            className="mb-4 text-muted-foreground"
            items={[{ label: "Início", href: "/" }, { label: "Loja" }]}
          />
          <Suspense fallback={null}>
            <LojaMarketplaceAlert />
          </Suspense>
          <h1 className="text-3xl font-bold text-foreground">Catálogo de TCGs</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Cada jogo te leva a universos diferentes. Explore cada universo, tudo no mesmo lugar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/loja/busca" prefetch>
                Buscar singles
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-border">
              <Link href="/marketplace/produtos" prefetch={false}>
                Produtos selados
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Escolha seu universo</h2>
        <Suspense fallback={<GameGridBootstrap />}>
          <GameGridStream />
        </Suspense>
      </div>
    </MobileLayout>
  );
}
