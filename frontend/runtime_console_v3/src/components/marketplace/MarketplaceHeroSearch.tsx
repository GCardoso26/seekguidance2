"use client";

import Link from "next/link";
import { Layers, ShoppingBag } from "lucide-react";
import { GlobalSearchBar } from "@/components/home/GlobalSearchBar";
import { Button } from "@/components/ui/button";
import { formatCountStable } from "@/lib/format-count";

type Props = {
  totalCards: number;
  gameCount: number;
};

/** Island client: busca + CTAs do hero (RSC renderiza o resto). */
export function MarketplaceHeroSearch({ totalCards, gameCount }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background pb-12 pt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-overline text-primary mb-2">Marketplace · 0% comissão · PIX direto</p>
        <h1 className="text-display-l font-bold tracking-tight text-foreground" data-testid="hero-title">
          O maior marketplace de TCGs do Brasil
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground">
          Magic, Pokémon, Yu-Gi-Oh!, Lorcana, Riftbound, Vanguard e mais. Compre, venda e monte decks com
          segurança.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <GlobalSearchBar placeholder="Cartas, lojas, decks..." />
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
