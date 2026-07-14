import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/carrinho", {
  title: "Carrinho",
  description: "Revise itens do carrinho e prossiga para o checkout no Judge TCG.",
});

export default function CarrinhoLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
