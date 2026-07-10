"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import {
  couponDisplayStatus,
  formatCouponDiscount,
  type SellerCouponRow,
} from "@/types/seller-coupon";
import { Button } from "@/components/ui/button";
import { DataTable } from "./DataTable";
import { CouponStatusBadge } from "./CouponStatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function formatUses(coupon: SellerCouponRow) {
  if (coupon.maxUses == null) return `${coupon.currentUses} / ∞`;
  return `${coupon.currentUses} / ${coupon.maxUses}`;
}

function buildCouponColumns(
  onEdit: (coupon: SellerCouponRow) => void,
  onToggleActive: (coupon: SellerCouponRow) => void,
  onDelete: (coupon: SellerCouponRow) => void,
  busyId?: string | null,
): ColumnDef<SellerCouponRow, unknown>[] {
  return [
    {
      id: "code",
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => <span className="font-mono font-medium text-primary">{row.original.code}</span>,
    },
    {
      id: "discountType",
      accessorKey: "discountType",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.discountType === "percentage" ? "Percentual" : "Fixo"}
        </span>
      ),
    },
    {
      id: "valueCents",
      accessorKey: "valueCents",
      header: "Desconto",
      cell: ({ row }) => formatCouponDiscount(row.original),
    },
    {
      id: "expiresAt",
      accessorKey: "expiresAt",
      header: "Válido até",
      cell: ({ row }) => formatDate(row.original.expiresAt),
    },
    {
      id: "uses",
      accessorFn: (row) => row.currentUses,
      header: "Usos",
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatUses(row.original)}</span>,
    },
    {
      id: "status",
      accessorFn: (row) => couponDisplayStatus(row),
      header: "Status",
      cell: ({ row }) => <CouponStatusBadge status={couponDisplayStatus(row.original)} />,
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const coupon = row.original;
        const isBusy = busyId === coupon.id;
        const status = couponDisplayStatus(coupon);
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(coupon)}
              disabled={isBusy}
              aria-label={`Editar ${coupon.code}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(coupon)}
              disabled={isBusy || status === "expired"}
              aria-label={coupon.isActive ? "Desativar" : "Ativar"}
            >
              {coupon.isActive ? "Off" : "On"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(coupon)}
              disabled={isBusy}
              aria-label={`Excluir ${coupon.code}`}
            >
              <Trash2 className="h-4 w-4 text-red-300" />
            </Button>
          </div>
        );
      },
    },
  ];
}

type Props = {
  coupons: SellerCouponRow[];
  onEdit: (coupon: SellerCouponRow) => void;
  onToggleActive: (coupon: SellerCouponRow) => void;
  onDelete: (coupon: SellerCouponRow) => void;
  busyId?: string | null;
};

export function CouponDesktopView({ coupons, onEdit, onToggleActive, onDelete, busyId }: Props) {
  return (
    <div data-testid="coupon-desktop-view">
      <DataTable
        data={coupons}
        columns={buildCouponColumns(onEdit, onToggleActive, onDelete, busyId)}
        testId="seller-coupons-table"
        emptyMessage="Nenhum cupom nesta página."
      />
      {coupons.some((c) => c.minOrderCents > 0) && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Pedidos mínimos:{" "}
          {coupons
            .filter((c) => c.minOrderCents > 0)
            .map((c) => `${c.code} ${formatShopPrice(c.minOrderCents)}`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
