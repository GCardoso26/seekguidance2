"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Layers, ShoppingBag } from "lucide-react";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { useCatalogHealth } from "@/hooks/useCatalogHealth";
import { getMegaMenuGames } from "@/lib/catalog-games";
import { formatCountStable } from "@/lib/format-count";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import Image from "next/image";

const CatalogMarketplaceSection = dynamic(
  () =>
    import("@/components/home/CatalogMarketplaceSection").then((m) => m.CatalogMarketplaceSection),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted/40" aria-hidden />,
  },
);

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
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background pb-12 pt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-overline text-primary mb-2">
          Marketplace · 0% comissão · Pagamento 100% seguro
        </p>
        <h1 className="text-display-l font-bold tracking-tight text-foreground" data-testid="hero-title">
          O maior marketplace de TCGs do Brasil
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground">
          Magic, Pokémon, Yu-Gi-Oh!, Lorcana, Riftbound, Vanguard e mais. Compre, venda e monte decks com segurança.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <GlobalSearchBar placeholder="Procure por carta, loja ou decks prontos..." />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span>{formatCountStable(totalCards)}+ cartas</span>
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
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-base hover:border-primary/30 hover:shadow-card-hover"
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
          <h2 className="text-h2 font-semibold text-foreground">Tendências de preço</h2>
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
        <h2 className="mb-4 text-h2 font-semibold text-foreground">Lojas em destaque</h2>
        <FeaturedShopsGrid />
      </div>
    </section>
  );
}

function WhyJudgeSection() {
  const items = [
    { title: "Compra 100% segura", text: "Nós garantimos a proteção dos seus dados e entrega real dos produtos" },
    { title: "Avaliações verificadas", text: "Reviews após entrega para confiança real entre compradores e vendedores." },
    { title: "Deckbuilder integrado", text: "Monte decks e encontre cards que faltam no marketplace." },
    { title: "Multi-TCG", text: "Todos os TCGs em um único lugar, sem a necessidade de multiplos acessos." },
  ];

  return (
    <section className="border-t border-border py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-center text-h2 font-semibold text-foreground">Por que comprar aqui</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="surface-card p-5">
              <h3 className="text-h4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-small text-muted-foreground">{item.text}</p>
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

function ProgressoTCGTeaser() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="rounded-xl border border-warning/20 bg-warning/5 p-8 text-center">
        <h2 className="text-h2 font-semibold text-foreground">Progresso TCG</h2>
        <p className="mt-2 text-small text-muted-foreground">
          Compre, venda, participe da plataforma para ganhar benefícios e participar de sorteios.
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
      <CatalogMarketplaceSection showHero={false} showGames={false} />
      <PriceTrendsSection />
      <FeaturedSellersSection />
      <WhyJudgeSection />
      <FinalCtaSection />
      <ProgressoTCGTeaser />
      <CommunityTeaser />
      <TournamentsTeaser />
    </MobileLayout>
  );
}
