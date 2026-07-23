"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCountStable } from "@/lib/format-count";

const GlobalSearchBar = dynamic(
  () => import("@/components/home/GlobalSearchBar").then((m) => m.GlobalSearchBar),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto h-12 w-full max-w-2xl rounded-md bg-muted/50" aria-hidden />
    ),
  },
);

type Props = {
  totalCards: number;
  gameCount: number;
};

/** Hero loja — só fatos (BP 5.2 Trust Engineering). */
export function MarketplaceHeroSearch({ totalCards, gameCount }: Props) {
  return (
    <section className="border-b border-border bg-background pb-10 pt-8">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-display-l font-semibold tracking-tight text-foreground" data-testid="hero-title">
          Cartas de Pokémon, Magic, Lorcana e outros jogos, vendidas por lojas especializadas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground">
          Compare preços e condições, veja quem vende e finalize no carrinho com PIX ou cartão.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <GlobalSearchBar placeholder="Buscar carta ou loja…" />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-small text-muted-foreground">
          <span>{formatCountStable(totalCards)} cartas no catálogo</span>
          <span>{gameCount} jogos</span>
          <span>CEP na página do produto; frete oficial no carrinho</span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground">
            <Link href="/loja/busca">
              <ShoppingBag className="mr-2 h-5 w-5" aria-hidden />
              Ver ofertas
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-caption text-muted-foreground">
          <Link href="/decks/novo" className="underline hover:text-foreground">
            Montar baralho
          </Link>
          {" · "}
          <Link href="/vendedor/painel/listagens/nova" className="underline hover:text-foreground">
            Anunciar
          </Link>
        </p>
      </div>
    </section>
  );
}
