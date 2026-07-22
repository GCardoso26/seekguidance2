import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/decks", {
  title: "Deck Workspace",
  description: "Workspace do jogador — análise, coleção, marketplace e histórico de decks no JudgeTCG.",
});

export default function DecksLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
