import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceHomeRsc } from "@/components/marketplace/MarketplaceHomeRsc";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/", {
  title: "Judge TCG — O maior marketplace de TCGs do Brasil",
  description:
    "Compre e venda cartas de Magic, Pokémon, Yu-Gi-Oh!, Lorcana, One Piece, FaB, Digimon, Star Wars, Riftbound, Sorcery, Union Arena, Dragon Ball e Vanguard. Zero comissão, PIX direto.",
  openGraph: {
    title: "Judge TCG — Marketplace de TCGs",
    description: "130K+ cartas · 13 jogos · 0% comissão",
    images: ["/og-image.jpg"],
  },
});

export default function HomePage() {
  return (
    <MarketplaceProviders>
      <Suspense
        fallback={
          <div className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
            Carregando marketplace…
          </div>
        }
      >
        <MarketplaceHomeRsc />
      </Suspense>
    </MarketplaceProviders>
  );
}
