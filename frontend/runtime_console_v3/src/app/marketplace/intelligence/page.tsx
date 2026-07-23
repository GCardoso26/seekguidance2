import type { Metadata } from "next";
import { MarketplaceIntelligenceClient } from "@/components/marketplace/MarketplaceIntelligenceClient";
import { withCanonical } from "@/lib/page-metadata";

type Props = { searchParams: Promise<{ cardId?: string }> };

export const metadata: Metadata = withCanonical("/marketplace/intelligence", {
  title: "Marketplace Intelligence",
  description: "Preço médio, liquidez, competição e sugestões para compradores e vendedores.",
});

export default async function MarketplaceIntelligencePage({ searchParams }: Props) {
  const { cardId } = await searchParams;
  return <MarketplaceIntelligenceClient cardId={cardId} />;
}
