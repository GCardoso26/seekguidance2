"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SellerTournamentRow } from "@/types/seller-tournament";
import { TournamentCards, TournamentEmptyState } from "./TournamentCards";
import { TournamentPagination } from "./TournamentPagination";
import { PageSkeleton } from "../PageShell";

const TournamentDesktopView = dynamic(
  () => import("./TournamentDesktopView").then((m) => m.TournamentDesktopView),
  { loading: () => <PageSkeleton rows={6} />, ssr: false },
);

const TournamentDetailsModal = dynamic(
  () => import("./TournamentDetailsModal").then((m) => m.TournamentDetailsModal),
  { ssr: false },
);

type ViewMode = "pending" | "table" | "cards";

type Props = {
  tournaments: SellerTournamentRow[];
  isLoading?: boolean;
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
};

export function TournamentManager({
  tournaments,
  isLoading,
  page = 1,
  total = 0,
  limit = 20,
  onPageChange,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [details, setDetails] = useState<SellerTournamentRow | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setViewMode(mobile ? "cards" : "table");
  }, []);

  if (isLoading || viewMode === "pending") return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      {tournaments.length === 0 && total === 0 ? (
        <TournamentEmptyState />
      ) : viewMode === "cards" ? (
        <TournamentCards tournaments={tournaments} onDetails={setDetails} />
      ) : (
        <TournamentDesktopView tournaments={tournaments} onDetails={setDetails} />
      )}

      {onPageChange && (
        <TournamentPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}

      {details && (
        <TournamentDetailsModal
          tournament={details}
          open
          onOpenChange={(open: boolean) => {
            if (!open) setDetails(null);
          }}
        />
      )}
    </div>
  );
}
