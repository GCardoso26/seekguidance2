"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { trackEvent } from "@/lib/analytics";
import type { TopMoverCard } from "@/lib/top-movers/types";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function money(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function TopMoversTableIsland({ rows }: { rows: TopMoverCard[] }) {
  useEffect(() => {
    void trackEvent("top_movers_open", { surface: "table", rows: rows.length });
  }, [rows.length]);

  if (!rows.length) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="Sem movers para este filtro"
        description="Ajuste jogo, período ou ordenação para ver o mercado novamente."
        action={{ label: "Limpar filtros", href: "/loja/tendencias" }}
      />
    );
  }

  return (
    <DataTable density="compact" stickyHeader>
      <DataTableHeader>
        <DataTableRow>
          <DataTableHead>Carta</DataTableHead>
          <DataTableHead>Preço</DataTableHead>
          <DataTableHead>Δ%</DataTableHead>
          <DataTableHead>Volume</DataTableHead>
          <DataTableHead>Liquidez</DataTableHead>
          <DataTableHead>Vendedores</DataTableHead>
          <DataTableHead>Última venda</DataTableHead>
          <DataTableHead>Ação</DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {rows.map((row) => (
          <DataTableRow key={row.card_id}>
            <DataTableCell>
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-caption text-muted-foreground">
                  {row.set} · {row.game}
                  {row.foil ? " · Foil" : ""}
                </p>
              </div>
            </DataTableCell>
            <DataTableCell className="tabular-nums">{money(row.price)}</DataTableCell>
            <DataTableCell
              className={cn(
                "tabular-nums font-medium",
                row.delta_pct >= 0 ? "text-success" : "text-danger",
              )}
            >
              {row.delta_pct >= 0 ? "+" : ""}
              {row.delta_pct.toFixed(1)}%
            </DataTableCell>
            <DataTableCell className="tabular-nums">{row.volume}</DataTableCell>
            <DataTableCell className="tabular-nums">{(row.liquidity * 100).toFixed(0)}%</DataTableCell>
            <DataTableCell className="tabular-nums">{row.sellers}</DataTableCell>
            <DataTableCell>{row.last_sale ?? "—"}</DataTableCell>
            <DataTableCell>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/loja/busca?q=${encodeURIComponent(row.name)}`}
                  onClick={() => {
                    void trackEvent("top_movers_card_open", { card_id: row.card_id });
                    void trackEvent("top_movers_buy_click", { card_id: row.card_id });
                  }}
                >
                  Abrir
                </Link>
              </Button>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
