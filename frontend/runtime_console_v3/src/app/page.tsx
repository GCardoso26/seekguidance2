import type { Metadata } from "next";
import { MarketplaceFirstLanding } from "@/components/marketplace/MarketplaceFirstLanding";

export const metadata: Metadata = {
  title: "Judge TCG — Marketplace de Cartas TCG com 0% Comissão",
  description:
    "Compre e venda cartas de Magic, Pokémon, Yu-Gi-Oh!, Lorcana e mais. Zero comissão, PIX direto, decks e juízes certificados.",
};

export default function HomePage() {
  return <MarketplaceFirstLanding />;
}
