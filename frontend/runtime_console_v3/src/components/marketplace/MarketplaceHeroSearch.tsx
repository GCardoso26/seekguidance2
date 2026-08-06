"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { formatCountStable } from "@/lib/format-count";

const GlobalSearchBar = dynamic(
  () => import("@/components/home/GlobalSearchBar").then((m) => m.GlobalSearchBar),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto h-11 w-full max-w-2xl rounded-md bg-muted/50" aria-hidden />
    ),
  },
);

type Props = {
  totalCards: number;
  gameCount: number;
};

/** Hero loja — busca como LCP; compacto para a vitrine caber no primeiro viewport. */
export function MarketplaceHeroSearch({ totalCards, gameCount }: Props) {
  return (
    <section className="border-b border-border bg-background py-8 sm:py-10">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        <p className="text-overline text-muted-foreground">Marketplace multi-TCG</p>
        <h1 className="mx-auto mt-2 max-w-3xl text-display-l font-semibold text-foreground" data-testid="hero-title">
          Onde comprar cartas e produtos TCG
        </h1>
        <p className="mx-auto mt-3 max-w-[62ch] text-body text-muted-foreground">
          Singles, selados e acessórios de lojas especializadas — preço, estoque e condição à vista.
        </p>

        <div className="mx-auto mt-6 max-w-2xl">
          <GlobalSearchBar placeholder="Buscar carta, booster ou acessório…" />
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-1 text-small text-muted-foreground">
          <span>{formatCountStable(totalCards)} cartas no catálogo</span>
          <span>{gameCount} jogos</span>
          <span>Frete oficial no carrinho</span>
        </div>

        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button size="lg" asChild className="min-h-11 bg-primary text-primary-foreground">
            <Link href="/loja/busca">Ver ofertas</Link>
          </Button>
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
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
