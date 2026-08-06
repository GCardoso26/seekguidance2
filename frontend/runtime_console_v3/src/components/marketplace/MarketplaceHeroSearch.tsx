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
    <section className="border-b border-border bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        <p className="text-overline text-muted-foreground">Marketplace multi-TCG</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-display-l font-semibold text-foreground" data-testid="hero-title">
          Onde comprar cartas e produtos TCG
        </h1>
        <p className="mx-auto mt-5 max-w-[62ch] text-body-lg text-muted-foreground">
          Singles, selados e acessórios de lojas especializadas — preço, estoque e condição à vista.
        </p>

        <div className="mx-auto mt-9 max-w-2xl">
          <GlobalSearchBar placeholder="Buscar carta, booster ou acessório…" />
        </div>

        <div className="mx-auto mt-6 grid max-w-3xl gap-x-6 gap-y-2 text-small text-muted-foreground sm:grid-cols-3">
          <span>{formatCountStable(totalCards)} cartas no catálogo</span>
          <span>{gameCount} jogos</span>
          <span>Frete oficial no carrinho</span>
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="min-h-12 bg-primary text-primary-foreground">
            <Link href="/loja/busca">Ver ofertas</Link>
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
