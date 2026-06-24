import type { Metadata } from "next";
import { MarketplaceFirstLanding } from "@/components/marketplace/MarketplaceFirstLanding";

export const metadata: Metadata = {
  title: "Judge TCG — O maior marketplace de TCGs do Brasil",
  description:
    "Compre e venda cartas de Magic, Pokémon, Yu-Gi-Oh!, Lorcana, One Piece, FaB, Digimon, Star Wars, Riftbound, Sorcery, Union Arena, Dragon Ball e Vanguard. Zero comissão, PIX direto.",
  openGraph: {
    title: "Judge TCG — Marketplace de TCGs",
    description: "130K+ cartas · 13 jogos · 0% comissão",
    images: ["/og-image.jpg"],
  },
};

export default function HomePage() {
  return <MarketplaceFirstLanding />;
}
