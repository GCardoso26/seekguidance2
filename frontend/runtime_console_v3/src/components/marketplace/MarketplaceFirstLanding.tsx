"use client";

import Link from "next/link";
import { Layers, ShoppingBag } from "lucide-react";
import { CatalogMarketplaceSection } from "@/components/home/CatalogMarketplaceSection";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

function MarketplaceHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-luxury-gold/10 to-luxury-onyx pb-12 pt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-luxury-gold">
          Marketplace · 0% comissão · PIX direto
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-luxury-frost md:text-5xl">
          A maior loja de TCGs do Brasil
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-luxury-mist md:text-lg">
          Magic, Pokémon, Yu-Gi-Oh!, Lorcana e mais. Compre, venda e monte decks com segurança.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold/90">
            <Link href="/loja/busca">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explorar cartas
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-luxury-gold/30">
            <Link href="/decks/novo">
              <Layers className="mr-2 h-5 w-5" />
              Montar deck
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-luxury-mist">
          <span>50.000+ cartas</span>
          <span>200+ vendedores</span>
          <span>Compra garantida</span>
        </div>
      </div>
    </section>
  );
}

function LigaPassTeaser() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <h2 className="text-xl font-bold text-luxury-frost">Liga Pass</h2>
        <p className="mt-2 text-sm text-luxury-mist">
          Compre, venda e jogue para subir de nível. Frete grátis, cashback e benefícios.
        </p>
        <Link href="/perfil/liga-pass" className="mt-4 inline-block text-sm text-luxury-gold hover:underline">
          Ver meu progresso →
        </Link>
      </div>
    </section>
  );
}

function CommunityTeaser() {
  return (
    <section className="container mx-auto border-t border-white/10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-luxury-frost">Comunidade</h2>
        <Link href="/comunidade" className="text-sm text-luxury-mist hover:text-luxury-gold">
          Fóruns, decks e mais →
        </Link>
      </div>
    </section>
  );
}

function TournamentsTeaser() {
  return (
    <section className="border-t border-white/10 bg-luxury-obsidian/50 py-8">
      <p className="container mx-auto px-4 text-center text-sm text-luxury-mist">
        <Link href="/comunidade/torneios" className="text-luxury-gold hover:underline">
          Encontre torneios
        </Link>
        {" · "}
        <Link href="/regras" className="text-luxury-gold hover:underline">
          Consulte as regras
        </Link>
        {" · "}
        <Link href="/judge" className="text-luxury-gold hover:underline">
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
      <CatalogMarketplaceSection />
      <LigaPassTeaser />
      <CommunityTeaser />
      <TournamentsTeaser />
    </MobileLayout>
  );
}
