"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { pairingFormatLabel } from "@/lib/seller-tournament-form";
import type { SellerTournamentRow } from "@/types/seller-tournament";
import { Button } from "@/components/ui/button";
import { DataTable } from "../DataTable";
import { TournamentStatusBadge } from "./TournamentStatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function formatFee(cents: number) {
  if (cents <= 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function buildColumns(
  onDetails: (t: SellerTournamentRow) => void,
): ColumnDef<SellerTournamentRow, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => <span className="font-medium text-luxury-frost">{row.original.name}</span>,
    },
    {
      id: "game",
      accessorKey: "gameName",
      header: "Jogo",
    },
    {
      id: "pairing",
      accessorFn: (row) => row.pairingFormat,
      header: "Formato",
      cell: ({ row }) => pairingFormatLabel(row.original.pairingFormat),
    },
    {
      id: "startsAt",
      accessorKey: "startsAt",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.startsAt),
    },
    {
      id: "fee",
      accessorFn: (row) => row.entryFeeCents,
      header: "Inscrição",
      cell: ({ row }) => formatFee(row.original.entryFeeCents),
    },
    {
      id: "status",
      accessorKey: "statusLabel",
      header: "Status",
      cell: ({ row }) => (
        <TournamentStatusBadge status={row.original.status} label={row.original.statusLabel} />
      ),
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onDetails(row.original)}>
            Detalhes
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/tournament/${row.original.id}/play`}>Gerenciar</Link>
          </Button>
        </div>
      ),
    },
  ];
}

type Props = {
  tournaments: SellerTournamentRow[];
  onDetails: (t: SellerTournamentRow) => void;
};

export function TournamentDesktopView({ tournaments, onDetails }: Props) {
  return (
    <div data-testid="tournament-desktop-view">
      <DataTable
        columns={buildColumns(onDetails)}
        data={tournaments}
        testId="seller-tournaments-table"
      />
    </div>
  );
}
