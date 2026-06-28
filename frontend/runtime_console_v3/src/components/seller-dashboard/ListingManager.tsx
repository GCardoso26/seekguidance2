"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SellerListingRow } from "@/types/seller-listing";
import { EmptyState } from "./EmptyState";
import { ListingCards } from "./ListingCards";
import { ListingsPagination, NovaListagemButton } from "./ListingsPagination";
import { PageSkeleton } from "./PageShell";

const ListingsDesktopView = dynamic(
  () => import("./ListingsDesktopView").then((mod) => mod.ListingsDesktopView),
  { loading: () => <PageSkeleton rows={6} />, ssr: false },
);

type ViewMode = "pending" | "table" | "cards";

type Props = {
  listings: SellerListingRow[];
  isLoading?: boolean;
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
};

export function ListingManager({
  listings,
  isLoading,
  page = 1,
  total = 0,
  limit = 24,
  onPageChange,
}: Props) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setViewMode(mobile ? "cards" : "table");
  }, []);

  const deactivate = useCallback(
    async (listingId: string) => {
      await fetch(`/api/seller/listings/${encodeURIComponent(listingId)}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
    },
    [queryClient],
  );

  if (isLoading || viewMode === "pending") return <PageSkeleton rows={6} />;

  if (listings.length === 0 && total === 0) {
    return (
      <EmptyState
        title="Nenhuma listagem ainda"
        description="Abra uma carta no catálogo ou crie uma nova listagem."
        action={<NovaListagemButton />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === "cards" ? (
        <ListingCards listings={listings} onDeactivate={(id) => void deactivate(id)} />
      ) : (
        <ListingsDesktopView listings={listings} onDeactivate={(id) => void deactivate(id)} />
      )}
      {onPageChange && (
        <ListingsPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
