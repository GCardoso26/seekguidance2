import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceHomeRsc } from "@/components/marketplace/MarketplaceHomeRsc";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/", {
  title: "Judge TCG — cartas de Pokémon, Magic, Lorcana e outros jogos",
  description:
    "Compare ofertas de lojas especializadas em cartas colecionáveis. Veja condição, preço e vendedor; pague com PIX ou cartão no checkout.",
  openGraph: {
    title: "Judge TCG — loja de cartas colecionáveis",
    description: "Ofertas de lojas · catálogo multi-jogo · pagamento no checkout",
    images: ["/og-image.jpg"],
  },
});

export default function HomePage() {
  return (
    <MarketplaceProviders>
      <Suspense
        fallback={
          <div className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
            Carregando a loja…
          </div>
        }
      >
        <MarketplaceHomeRsc />
      </Suspense>
    </MarketplaceProviders>
  );
}
