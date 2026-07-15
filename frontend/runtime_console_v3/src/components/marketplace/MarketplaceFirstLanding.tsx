"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Layers, ShoppingBag } from "lucide-react";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TrustFooterStrip } from "@/components/layout/TrustFooterStrip";
import { Button } from "@/components/ui/button";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { getMegaMenuGames } from "@/lib/catalog-games";
import { formatCountStable } from "@/lib/format-count";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

const CatalogMarketplaceSection = dynamic(
  () =>
    import("@/components/home/CatalogMarketplaceSection").then((m) => m.CatalogMarketplaceSection),
  {
    loading: () => <div className="h-64 rounded-lg bg-muted/40" aria-hidden />,
  },
);

const FeaturedShopsGrid = dynamic(
  () => import("@/components/marketplace/FeaturedShopsGrid").then((m) => m.FeaturedShopsGrid),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-4" data-testid="featured-shops-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-muted/40" />
        ))}
      </div>
    ),
  },
);

function MarketplaceHero() {
  const { data: health } = useCatalogHealth();
  const totalCards = health?.total_cards ?? 50000;
  const gameCount = getMegaMenuGames(health).length;

  return (
    <section className="relative overflow-hidden border-b border-border bg-background pb-12 pt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2 text-small font-medium text-primary">Loja de cartas · Pagamento com PIX</p>
        <h1 className="text-display-l font-bold tracking-tight text-foreground" data-testid="hero-title">
          Compre cartas colecionáveis com clareza
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground">
          Compare ofertas de lojas, veja o estado da carta e finalize no carrinho. Sem surpresas no
          caminho.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <GlobalSearchBar placeholder="Buscar carta ou loja…" />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-small text-muted-foreground">
          <span>{formatCountStable(totalCards)}+ cartas</span>
          <span>{gameCount} jogos</span>
          <span>Acompanhe seus pedidos na conta</span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/loja/busca">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver ofertas
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/decks/novo">
              <Layers className="mr-2 h-5 w-5" />
              Montar baralho
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function PopularGamesSection() {
  const { data: health } = useCatalogHealth();
  const games = getMegaMenuGames(health);

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Jogos populares</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7" data-testid="game-grid">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/loja/${gameSlugFromId(game.id as GameId)}`}
            data-testid={`game-card-${gameSlugFromId(game.id as GameId)}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/30"
          >
            <Image
              src={game.logoUrl}
              alt=""
              width={48}
              height={48}
              quality={60}
              className="h-12 w-12 object-contain"
            />
            <span className="text-center text-sm font-medium">{game.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedSellersSection() {
  return (
    <section className="border-t border-border bg-card/30 py-8">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-h2 font-semibold text-foreground">Lojas em destaque</h2>
        <FeaturedShopsGrid />
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-border py-16">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">Pronto para comprar?</h2>
        <p className="mt-2 text-muted-foreground">Abra a busca de ofertas ou anuncie cartas da sua loja.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground">
            <Link href="/loja/busca">Ver ofertas</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-h-12">
            <Link href="/vendedor/painel/listagens/nova">Anunciar cartas</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function MarketplaceFirstLanding() {
  return (
    <MobileLayout>
      <MarketplaceHero />
      <PopularGamesSection />
      <CatalogMarketplaceSection showHero={false} showGames={false} />
      <FeaturedSellersSection />
      <FinalCtaSection />
      <TrustFooterStrip />
    </MobileLayout>
  );
}
