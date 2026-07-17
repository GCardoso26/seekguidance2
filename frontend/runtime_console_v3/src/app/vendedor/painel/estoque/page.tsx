"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  AsyncPageBody,
  PageEmpty,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { InventoryDashboardStrip } from "@/components/seller-inventory/InventoryDashboardStrip";
import { InventoryDataTable } from "@/components/seller-inventory/InventoryDataTable";
import { InventoryExportMenu } from "@/components/seller-inventory/InventoryExportMenu";
import { InventoryImportWizard } from "@/components/seller-inventory/InventoryImportWizard";
import { InventoryKindTabs } from "@/components/seller-inventory/InventoryKindTabs";
import { InventorySearchPanel } from "@/components/seller-inventory/InventorySearchPanel";
import type {
  DashboardAction,
  InventoryKind,
  InventorySearchResponse,
  InventorySource,
  SalesPeriod,
  StockFilter,
} from "@/components/seller-inventory/types";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";
import { useSellerStore } from "@/hooks/useSellerStore";

const FILTERS_KEY = "judgetcg.inventory.savedFilters";
const HISTORY_KEY = "judgetcg.inventory.searchHistory";

export default function EstoquePage() {
  const { hasStore, isLoading: storeLoading } = useSellerStore();

  const [kind, setKind] = useState<InventoryKind>("cards");
  const [game, setGame] = useState("mtg");
  const [source, setSource] = useState<InventorySource>("my_catalog");
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [health, setHealth] = useState<string | null>(null);
  const [maxStock, setMaxStock] = useState<number | null>(null);
  const [period, setPeriod] = useState<SalesPeriod>("month");
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const searchKey = useMemo(
    () => [
      "seller-inventory-search",
      source,
      kind,
      game,
      committedQuery,
      stockFilter,
      health,
      maxStock,
      period,
      page,
    ],
    [source, kind, game, committedQuery, stockFilter, health, maxStock, period, page],
  );

  const dashQuery = useQuery({
    queryKey: ["seller-inventory-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/seller/inventory/dashboard");
      if (!res.ok) throw new Error("dashboard_failed");
      return res.json() as Promise<{
        actions: DashboardAction[];
        totals: Record<string, number>;
      }>;
    },
    enabled: hasStore,
  });

  const analyticsQuery = useQuery({
    queryKey: ["seller-inventory-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/seller/inventory/analytics");
      if (!res.ok) throw new Error("analytics_failed");
      return res.json() as Promise<{
        kpis: Record<string, unknown>;
        suggestions: Array<{ id: string; text: string; filter: string }>;
      }>;
    },
    enabled: hasStore,
  });

  const {
    data: searchData,
    isLoading: loadingSearch,
    isError: searchError,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: searchKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        source,
        kind,
        game,
        stock_filter: stockFilter,
        period,
        page: String(page),
        limit: "48",
      });
      if (committedQuery.trim()) params.set("q", committedQuery.trim());
      if (health) params.set("health", health);
      if (maxStock != null) params.set("max_stock", String(maxStock));
      const res = await fetch(`/api/seller/inventory/search?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<InventorySearchResponse>;
    },
    enabled: hasStore,
  });

  const runSearch = useCallback(() => {
    setPage(1);
    setCommittedQuery(query);
    if (query.trim()) {
      try {
        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as string[];
        const next = [query.trim(), ...hist.filter((h) => h !== query.trim())].slice(0, 8);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  }, [query]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (query !== committedQuery) runSearch();
    }, 350);
    return () => window.clearTimeout(t);
  }, [query, committedQuery, runSearch]);

  function saveCurrentFilter() {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "[]") as Array<Record<string, string>>;
      saved.unshift({
        label: `${kind}/${source}/${committedQuery || "*"}`,
        kind,
        source,
        game,
        q: committedQuery,
        stockFilter,
      });
      localStorage.setItem(FILTERS_KEY, JSON.stringify(saved.slice(0, 8)));
    } catch {
      /* ignore */
    }
  }

  if (storeLoading) {
    return (
      <PageShell>
        <PageSkeleton rows={4} />
      </PageShell>
    );
  }

  if (!hasStore) {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Você ainda não tem uma loja cadastrada"
          action={{ label: "Cadastrar loja", href: "/stores/create" }}
        />
      </PageShell>
    );
  }

  const items = searchData?.items ?? [];
  const total = searchData?.total ?? 0;
  const hasMore = Boolean(searchData?.has_more);
  const suggestions = analyticsQuery.data?.suggestions ?? [];

  return (
    <>
      <SellerHeader />
      <PageShell className="space-y-6">
        <PageHeader
          title="Estoque"
          description="Plataforma de inventário — dashboard, busca multi-fonte, tabela ERP e saúde do catálogo."
        />

        <AsyncPageBody
          isLoading={dashQuery.isLoading}
          isError={dashQuery.isError}
          onRetry={() => void dashQuery.refetch()}
          errorMessage="Não foi possível carregar o dashboard de estoque."
          skeletonRows={2}
        >
          <InventoryDashboardStrip
            actions={dashQuery.data?.actions ?? []}
            totals={dashQuery.data?.totals}
            activeFilterId={activeActionId}
            onActionClick={(action) => {
              setActiveActionId(action.id);
              const f = action.filter || {};
              setSource("my_catalog");
              setKind("cards");
              if (f.stock_filter === "without_stock") setStockFilter("without_stock");
              else if (f.stock_filter === "with_stock") setStockFilter("with_stock");
              else setStockFilter("all");
              if (typeof f.health === "string") setHealth(f.health);
              else setHealth(null);
              if (typeof f.max_stock === "number") setMaxStock(f.max_stock);
              else setMaxStock(null);
              setPage(1);
            }}
          />
        </AsyncPageBody>

        {suggestions.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Sugestões (somente leitura)</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {suggestions.map((s) => (
                <li key={s.id}>
                  {s.text}
                  {s.filter ? (
                    <button
                      type="button"
                      className="ml-2 text-primary underline"
                      onClick={() => {
                        setActiveActionId(s.id);
                        setSource("my_catalog");
                        setKind("cards");
                        setPage(1);
                        if (s.filter === "without_stock") {
                          setStockFilter("without_stock");
                          setHealth(null);
                          setMaxStock(null);
                        } else if (s.filter === "missing_image" || s.filter === "health_critical") {
                          setStockFilter("all");
                          setHealth("missing_image");
                          setMaxStock(null);
                        } else if (s.filter === "low_stock") {
                          setStockFilter("with_stock");
                          setHealth(null);
                          setMaxStock(3);
                        } else {
                          setStockFilter("all");
                          setHealth(null);
                          setMaxStock(null);
                        }
                      }}
                    >
                      Filtrar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <InventoryKindTabs
          kind={kind}
          onKindChange={(k) => {
            setKind(k);
            setPage(1);
          }}
          game={game}
          onGameChange={(g) => {
            setGame(g);
            setPage(1);
          }}
        />

        <InventorySearchPanel
          source={source}
          onSourceChange={(s) => {
            setSource(s);
            setPage(1);
          }}
          query={query}
          onQueryChange={setQuery}
          stockFilter={stockFilter}
          onStockFilterChange={(f) => {
            setStockFilter(f);
            setHealth(null);
            setMaxStock(null);
            setActiveActionId(null);
            setPage(1);
          }}
          period={period}
          onPeriodChange={(p) => {
            setPeriod(p);
            setPage(1);
          }}
          onSearch={runSearch}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <InventoryExportMenu
            source={source}
            kind={kind}
            game={game}
            query={committedQuery}
            selectedIds={[]}
          />
          <Button type="button" size="sm" variant="ghost" onClick={saveCurrentFilter}>
            Salvar filtro
          </Button>
        </div>

        {searchError ? (
          <InlineAlert
            message="Não foi possível buscar o estoque."
            tone="error"
            onRetry={() => void refetchSearch()}
          />
        ) : null}

        {loadingSearch ? (
          <PageSkeleton rows={4} />
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {total} resultado{total === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
            <InventoryDataTable
              items={items}
              kind={kind}
              queryKey={searchKey}
              highlight={committedQuery}
            />
          </>
        )}

        <InventoryImportWizard
          onImported={() => {
            void dashQuery.refetch();
            void refetchSearch();
          }}
        />
      </PageShell>
    </>
  );
}
