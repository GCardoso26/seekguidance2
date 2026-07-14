import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MarketplaceHeroSearch } from "@/components/marketplace/MarketplaceHeroSearch";
import { MarketplaceHomeInteractiveSections } from "@/components/marketplace/MarketplaceHomeInteractiveSections";
import { Button } from "@/components/ui/button";
import { fetchCatalogHealth } from "@/lib/seo-metadata";
import { getMegaMenuGames, MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import { gameSlugFromId } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import type { CatalogHealthReport } from "@/types/card";

function asHealth(
  raw: { total_cards?: number; by_game?: Record<string, number> } | null,
): CatalogHealthReport {
  if (!raw) return MOCK_CATALOG_HEALTH;
  return {
    ...MOCK_CATALOG_HEALTH,
    total_cards: raw.total_cards ?? MOCK_CATALOG_HEALTH.total_cards,
    by_game: raw.by_game ?? MOCK_CATALOG_HEALTH.by_game,
  };
}

function PopularGamesSection({ health }: { health: CatalogHealthReport }) {
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
              sizes="48px"
              unoptimized={shouldBypassImageOptimizer(game.logoUrl)}
              className="h-12 w-12 object-contain"
            />
            <span className="text-center text-sm font-medium">{game.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function PopularGamesStream() {
  const raw = await fetchCatalogHealth();
  return <PopularGamesSection health={asHealth(raw)} />;
}

function WhyJudgeSection() {
  const items = [
    { title: "Compra 100% segura", text: "Nós garantimos a proteção dos seus dados e entrega real dos produtos" },
    {
      title: "Avaliações verificadas",
      text: "Reviews após entrega para confiança real entre compradores e vendedores.",
    },
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

function StaticTeasers() {
  return (
    <>
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-8 text-center">
          <h2 className="text-h2 font-semibold text-foreground">Liga Pass</h2>
          <p className="mt-2 text-small text-muted-foreground">
            Compre, venda e jogue para subir de nível. Frete grátis, cashback e benefícios.
          </p>
          <Link href="/perfil/liga-pass" className="mt-4 inline-block text-sm text-primary hover:underline">
            Ver meu progresso →
          </Link>
        </div>
      </section>
      <section className="container mx-auto border-t border-border px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Comunidade</h2>
          <Link href="/comunidade" className="text-sm text-muted-foreground hover:text-primary">
            Fóruns, decks e mais →
          </Link>
        </div>
      </section>
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
    </>
  );
}

/** Home marketplace — hero imediato (sem await), games/health em stream. */
export function MarketplaceHomeRsc() {
  const bootstrap = MOCK_CATALOG_HEALTH;
  const totalCards = bootstrap.total_cards ?? 50_000;
  const gameCount = getMegaMenuGames(bootstrap).length;

  return (
    <MobileLayout>
      <MarketplaceHeroSearch totalCards={totalCards} gameCount={gameCount} />
      <Suspense fallback={<PopularGamesSection health={bootstrap} />}>
        <PopularGamesStream />
      </Suspense>
      <Suspense
        fallback={<div className="h-96 animate-pulse bg-muted/30" aria-hidden data-testid="home-stream-fallback" />}
      >
        <MarketplaceHomeInteractiveSections />
      </Suspense>
      <WhyJudgeSection />
      <FinalCtaSection />
      <StaticTeasers />
    </MobileLayout>
  );
}
