import type { Metadata } from "next";
import { MarketplaceFirstLanding } from "@/components/marketplace/MarketplaceFirstLanding";

export const metadata: Metadata = {
  title: "Judge TCG — Marketplace de Cartas TCG com 0% Comissão",
  description:
    "Compre e venda cartas de Magic, Pokémon, Yu-Gi-Oh!, Lorcana, One Piece, FaB, Digimon, Star Wars, Riftbound, Sorcery, Union Arena, Dragon Ball e Vanguard. Zero comissão, PIX direto.",
};

export default function HomePage() {
  return <MarketplaceFirstLanding />;
}
