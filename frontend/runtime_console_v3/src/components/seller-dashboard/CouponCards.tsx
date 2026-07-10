"use client";

import { Pencil, Tag, Trash2 } from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import {
  couponDisplayStatus,
  formatCouponDiscount,
  type SellerCouponRow,
} from "@/types/seller-coupon";
import { Button } from "@/components/ui/button";
import { CouponStatusBadge } from "./CouponStatusBadge";

type Props = {
  coupons: SellerCouponRow[];
  onEdit: (coupon: SellerCouponRow) => void;
  onToggleActive: (coupon: SellerCouponRow) => void;
  onDelete: (coupon: SellerCouponRow) => void;
  busyId?: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "Sem validade";
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

export function CouponCards({ coupons, onEdit, onToggleActive, onDelete, busyId }: Props) {
  return (
    <ul className="space-y-3" data-testid="coupon-cards">
      {coupons.map((coupon) => {
        const status = couponDisplayStatus(coupon);
        const isBusy = busyId === coupon.id;
        return (
          <li key={coupon.id} className="surface-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono font-semibold text-primary">{coupon.code}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCouponDiscount(coupon)} · {coupon.discountType === "percentage" ? "%" : "fixo"}
                </p>
              </div>
              <CouponStatusBadge status={status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Válido até: {formatDate(coupon.expiresAt)} · Usos: {formatUses(coupon)}
            </p>
            {coupon.minOrderCents > 0 && (
              <p className="text-xs text-muted-foreground/80">
                Pedido mínimo: {formatShopPrice(coupon.minOrderCents)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => onEdit(coupon)}
                disabled={isBusy}
                data-testid={`coupon-edit-${coupon.id}`}
              >
                <Pencil className="mr-1 h-3 w-3" aria-hidden />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => onToggleActive(coupon)}
                disabled={isBusy || status === "expired"}
                data-testid={`coupon-toggle-${coupon.id}`}
              >
                {coupon.isActive ? "Desativar" : "Ativar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-300 hover:text-red-200"
                onClick={() => onDelete(coupon)}
                disabled={isBusy}
                data-testid={`coupon-delete-${coupon.id}`}
              >
                <Trash2 className="mr-1 h-3 w-3" aria-hidden />
                Excluir
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CouponEmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed border-white/15 bg-muted/50 p-10 text-center"
      data-testid="coupons-empty"
    >
      <Tag className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="mt-3 text-muted-foreground">Nenhum cupom criado.</p>
      <p className="mt-1 text-sm text-muted-foreground/70">Crie um cupom para oferecer descontos na sua loja.</p>
    </div>
  );
}
