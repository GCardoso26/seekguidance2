"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import type { SellerListingRow } from "@/types/seller-listing";
import {
  archiveListingPatch,
  bulkDuplicateListings,
  bulkPatchListings,
} from "@/lib/seller-bulk-listings";
import { pushRecentSearch } from "@/lib/seller-listings-erp-preferences";
import { useSellerWorkspacePreferences } from "@/hooks/useSellerWorkspacePreferences";
import { EmptyState } from "./EmptyState";
import { ListingCards } from "./ListingCards";
import { ListingsPagination, NovaListagemButton } from "./ListingsPagination";
import { PageSkeleton } from "./PageShell";
import {
  applyBulkPrice,
  BulkConfirmModal,
  BulkInventoryModal,
  BulkPriceModal,
} from "./listings/BulkListingsModals";
import {
  ListingsErpSettings,
  useListingsErpPreferencesState,
} from "./listings/ListingsErpSettings";
import {
  filterListingsClient,
  ListingsToolbar,
  type ListingsFilterState,
} from "./listings/ListingsToolbar";
import { saveListingsErpPreferences } from "@/lib/seller-listings-erp-preferences";

const ListingsErpTable = dynamic(
  () => import("./listings/ListingsErpTable").then((m) => m.ListingsErpTable),
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
  apiStatusFilter?: string;
};

export function ListingManager({
  listings,
  isLoading,
  page = 1,
  total = 0,
  limit = 24,
  onPageChange,
  apiStatusFilter = "",
}: Props) {
  const queryClient = useQueryClient();
  const { prefs: workspacePrefs } = useSellerWorkspacePreferences();
  const { prefs: erpPrefs, setPrefs: setErpPrefs } = useListingsErpPreferencesState();
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [filters, setFilters] = useState<ListingsFilterState>({ search: "", status: "" });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setViewMode(mobile ? "cards" : "table");
  }, []);

  useEffect(() => {
    function onApplyFilter(e: Event) {
      const detail = (e as CustomEvent<ListingsFilterState>).detail;
      if (detail) setFilters(detail);
    }
    window.addEventListener("listings-apply-saved-filter", onApplyFilter);
    return () => window.removeEventListener("listings-apply-saved-filter", onApplyFilter);
  }, []);

  const filtered = useMemo(
    () => filterListingsClient(listings, filters),
    [listings, filters],
  );

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  );

  const selectedRows = useMemo(
    () => listings.filter((l) => selectedIds.includes(l.id)),
    [listings, selectedIds],
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
  }, [queryClient]);

  const deactivate = useCallback(
    async (listingId: string) => {
      await fetch(`/api/seller/listings/${encodeURIComponent(listingId)}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const runBulk = useCallback(
    async (label: string, fn: () => Promise<{ ok: string[]; failed: string[] }>) => {
      setBulkBusy(true);
      try {
        const result = await fn();
        if (result.failed.length === 0) {
          toast.success(`${label}: ${result.ok.length} atualizado(s)`);
        } else {
          toast.warning(
            `${label}: ${result.ok.length} ok, ${result.failed.length} falha(s)`,
          );
        }
        setRowSelection({});
        await refresh();
      } catch {
        toast.error(`Falha em ${label}`);
      } finally {
        setBulkBusy(false);
      }
    },
    [refresh],
  );

  const onBulkPriceApply = useCallback(
    (mode: "percent" | "fixed", value: number) => {
      if (!selectedIds.length) return;
      const patches = applyBulkPrice(listings, selectedIds, mode, value);
      void runBulk("Preços", async () => {
        const results = await Promise.all(
          Object.entries(patches).map(([id, price]) =>
            bulkPatchListings([id], { price }),
          ),
        );
        return results.reduce(
          (acc, r) => ({
            ok: [...acc.ok, ...r.ok],
            failed: [...acc.failed, ...r.failed],
          }),
          { ok: [] as string[], failed: [] as string[] },
        );
      });
    },
    [selectedIds, listings, runBulk],
  );

  const onSearchChange = useCallback(
    (next: ListingsFilterState) => {
      setFilters(next);
      if (next.search.trim()) {
        const updated = pushRecentSearch(erpPrefs, next.search);
        saveListingsErpPreferences(updated);
        setErpPrefs(updated);
      }
    },
    [erpPrefs, setErpPrefs],
  );

  if (isLoading || viewMode === "pending") return <PageSkeleton rows={6} />;

  if (listings.length === 0 && total === 0 && !apiStatusFilter) {
    return (
      <EmptyState
        title="Nenhuma listagem ainda"
        description="Publique sua primeira carta em menos de 15 segundos."
        action={<NovaListagemButton />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ListingsToolbar
        onFilterChange={onSearchChange}
        selectedCount={selectedIds.length}
        onBulkPause={() => void runBulk("Pausar", () => bulkPatchListings(selectedIds, { status: "inactive" }))}
        onBulkActivate={() => void runBulk("Publicar", () => bulkPatchListings(selectedIds, { status: "active" }))}
        onBulkPriceAdjust={(p) => onBulkPriceApply("percent", p)}
        onOpenPriceModal={() => setPriceModalOpen(true)}
        onOpenInventoryModal={() => setInventoryModalOpen(true)}
        onBulkArchive={() => setArchiveModalOpen(true)}
        onBulkDuplicate={() => setDuplicateModalOpen(true)}
        onDuplicateRow={(id) => {
          const row = listings.find((l) => l.id === id);
          if (row) {
            void runBulk("Duplicar", () => bulkDuplicateListings([row]));
          }
        }}
        busy={bulkBusy}
        recentSearches={erpPrefs.recentSearches}
      />

      <ListingsErpSettings
        filters={filters}
        listings={filtered}
        prefs={erpPrefs}
        onPreferencesChange={setErpPrefs}
      />

      {viewMode === "cards" ? (
        <ListingCards listings={filtered} onDeactivate={(id) => void deactivate(id)} />
      ) : (
        <ListingsErpTable
          listings={filtered}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onRefresh={() => void refresh()}
          columnPrefs={erpPrefs}
          density={workspacePrefs.tableDensity}
        />
      )}
      {onPageChange && (
        <ListingsPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}

      <BulkPriceModal
        open={priceModalOpen}
        onOpenChange={setPriceModalOpen}
        selectedCount={selectedIds.length}
        onApply={onBulkPriceApply}
      />
      <BulkInventoryModal
        open={inventoryModalOpen}
        onOpenChange={setInventoryModalOpen}
        selectedCount={selectedIds.length}
        onApply={(quantity) =>
          void runBulk("Estoque", () => bulkPatchListings(selectedIds, { quantity }))
        }
      />
      <BulkConfirmModal
        open={archiveModalOpen}
        title="Arquivar anúncios"
        description={`${selectedIds.length} anúncio(s) serão pausados (inativos).`}
        confirmLabel="Arquivar"
        onOpenChange={setArchiveModalOpen}
        onConfirm={() =>
          void runBulk("Arquivar", () =>
            bulkPatchListings(selectedIds, archiveListingPatch()),
          )
        }
      />
      <BulkConfirmModal
        open={duplicateModalOpen}
        title="Duplicar anúncios"
        description={`Criar cópias de ${selectedRows.length} anúncio(s) selecionado(s).`}
        confirmLabel="Duplicar"
        onOpenChange={setDuplicateModalOpen}
        onConfirm={() => void runBulk("Duplicar", () => bulkDuplicateListings(selectedRows))}
      />
    </div>
  );
}
