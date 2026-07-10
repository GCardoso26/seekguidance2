"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { AddListingDrawer } from "./AddListingDrawer";
import { CardGrid } from "./CardGrid";
import { CardSearchInput } from "./CardSearchInput";
import { GameSelectorTabs } from "./GameSelectorTabs";
import { useCatalogCards, type CatalogCard } from "@/hooks/useCatalogCards";

export function CatalogCardsPage() {
  const searchParams = useSearchParams();
  const [game, setGame] = useState("mtg");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [debounced, setDebounced] = useState("");
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch } = useCatalogCards(game, debounced);

  return (
    <>
      <SellerHeader action={null} />
      <PageShell>
        <PageHeader title="Cartas" description="Busque no catálogo e crie anúncios em um clique." />
        <GameSelectorTabs activeSlug={game} onChange={setGame} />
        <CardSearchInput value={search} onChange={setSearch} />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Buscando cartas…</p>
        ) : (
          <CardGrid cards={data?.cards ?? []} onAddListing={setSelectedCard} />
        )}
      </PageShell>
      <AddListingDrawer
        card={selectedCard}
        open={Boolean(selectedCard)}
        onOpenChange={(open) => {
          if (!open) setSelectedCard(null);
        }}
        onSaved={() => void refetch()}
      />
    </>
  );
}
