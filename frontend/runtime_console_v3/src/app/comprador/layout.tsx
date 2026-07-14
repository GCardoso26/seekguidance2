import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/comprador", {
  title: "Painel do comprador",
  description:
    "Acompanhe pedidos, wishlist, alertas de preço e recomendações no painel do comprador Judge TCG.",
});

export default function CompradorLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
