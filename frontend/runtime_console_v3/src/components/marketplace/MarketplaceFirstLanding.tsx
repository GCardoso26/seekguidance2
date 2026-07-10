"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Layers, ShoppingBag } from "lucide-react";
import { CatalogMarketplaceSection } from "@/components/home/CatalogMarketplaceSection";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { getMegaMenuGames } from "@/lib/catalog-games";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import Image from "next/image";

const TrendingCardsGrid = dynamic(
  () => import("@/components/marketplace/TrendingCardsGrid").then((m) => m.TrendingCardsGrid),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-3" data-testid="featured-cards-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    ),
  },
);

const FeaturedShopsGrid = dynamic(
  () => import("@/components/marketplace/FeaturedShopsGrid").then((m) => m.FeaturedShopsGrid),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-4" data-testid="featured-shops-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted/40" />
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
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-luxury-gold/10 to-luxury-onyx pb-12 pt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
          Marketplace · 0% comissão · PIX direto
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl" data-testid="hero-title">
          O maior marketplace de TCGs do Brasil
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Magic, Pokémon, Yu-Gi-Oh!, Lorcana, Riftbound, Vanguard e mais. Compre, venda e monte decks com segurança.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <GlobalSearchBar placeholder="Busque por card, seller ou deck…" />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span>{totalCards.toLocaleString("pt-BR")}+ cartas</span>
          <span>{gameCount} jogos</span>
          <span>Compra garantida</span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/loja/busca">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explorar cartas
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-primary/30">
            <Link href="/decks/novo">
              <Layers className="mr-2 h-5 w-5" />
              Montar deck
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
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 p-4 transition hover:border-primary/30 hover:shadow-lg"
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

function PriceTrendsSection() {
  return (
    <section className="border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">📈 Tendências de preço</h2>
          <Link href="/loja/tendencias" className="text-sm text-primary hover:underline">
            Ver todas →
          </Link>
        </div>
        <TrendingCardsGrid />
      </div>
    </section>
  );
}

function FeaturedSellersSection() {
  return (
    <section className="border-t border-border bg-card/30 py-8">
      <div className="container mx-auto px-4">
        <h2 className="mb-4 text-xl font-bold text-foreground">🏪 Lojas em destaque</h2>
        <FeaturedShopsGrid />
      </div>
    </section>
  );
}

function WhyJudgeSection() {
  const items = [
    { icon: "🛡️", title: "Checkout seguro", text: "Proteção ao comprador com checkout atômico e estoque reservado." },
    { icon: "⭐", title: "Avaliações verificadas", text: "Reviews após entrega para confiança real entre compradores e vendedores." },
    { icon: "🎴", title: "Deckbuilder integrado", text: "Monte decks e encontre cards faltantes no marketplace." },
    { icon: "🎮", title: "13 TCGs suportados", text: "Do Magic ao Vanguard, tudo em um só lugar." },
  ];

  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold text-foreground">Por que o Judge TCG?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="flex gap-4 surface-card p-4">
              <span className="text-3xl" aria-hidden>
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-border py-16">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">Comece agora</h2>
        <p className="mt-2 text-muted-foreground">Explore o catálogo ou comece a vender suas cartas hoje.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="bg-primary text-primary-foreground">
            <Link href="/loja/busca">Explorar cards</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-primary/30">
            <Link href="/vendedor/painel/listagens/nova">Vender cards</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function LigaPassTeaser() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Liga Pass</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compre, venda e jogue para subir de nível. Frete grátis, cashback e benefícios.
        </p>
        <Link href="/perfil/liga-pass" className="mt-4 inline-block text-sm text-primary hover:underline">
          Ver meu progresso →
        </Link>
      </div>
    </section>
  );
}

function CommunityTeaser() {
  return (
    <section className="container mx-auto border-t border-border px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Comunidade</h2>
        <Link href="/comunidade" className="text-sm text-muted-foreground hover:text-primary">
          Fóruns, decks e mais →
        </Link>
      </div>
    </section>
  );
}

function TournamentsTeaser() {
  return (
    <section className="border-t border-border bg-card/50 py-8">
      <p className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <Link href="/comunidade/torneios" className="text-primary hover:underline">
          Encontre torneios
        </Link>
        {" · "}
        <Link href="/regras" className="text-primary hover:underline">
          Consulte as regras
        </Link>
        {" · "}
        <Link href="/judge" className="text-primary hover:underline">
          Assistente de juiz
        </Link>
      </p>
    </section>
  );
}

export function MarketplaceFirstLanding() {
  return (
    <MobileLayout>
      <MarketplaceHero />
      <PopularGamesSection />
      <CatalogMarketplaceSection />
      <PriceTrendsSection />
      <FeaturedSellersSection />
      <WhyJudgeSection />
      <FinalCtaSection />
      <LigaPassTeaser />
      <CommunityTeaser />
      <TournamentsTeaser />
    </MobileLayout>
  );
}
