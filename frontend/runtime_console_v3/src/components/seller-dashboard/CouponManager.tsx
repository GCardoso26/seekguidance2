"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SellerCouponRow } from "@/types/seller-coupon";
import { CouponCards, CouponEmptyState } from "./CouponCards";
import { CouponPagination } from "./CouponPagination";
import { PageSkeleton } from "./PageShell";

const CouponDesktopView = dynamic(
  () => import("./CouponDesktopView").then((mod) => mod.CouponDesktopView),
  { loading: () => <PageSkeleton rows={6} />, ssr: false },
);

const CouponEditModal = dynamic(
  () => import("./CouponEditModal").then((mod) => mod.CouponEditModal),
  { ssr: false },
);

type ViewMode = "pending" | "table" | "cards";

type Props = {
  storeId: string;
  coupons: SellerCouponRow[];
  isLoading?: boolean;
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onUpdated: () => void;
};

export function CouponManager({
  storeId,
  coupons,
  isLoading,
  page = 1,
  total = 0,
  limit = 20,
  onPageChange,
  onUpdated,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [editing, setEditing] = useState<SellerCouponRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setViewMode(mobile ? "cards" : "table");
  }, []);

  async function toggleActive(coupon: SellerCouponRow) {
    setBusyId(coupon.id);
    try {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(coupon.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !coupon.isActive }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String((data as { detail?: string }).detail ?? "Falha ao atualizar status"));
      }
      toast.success(coupon.isActive ? "Cupom desativado" : "Cupom ativado");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar cupom");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCoupon(coupon: SellerCouponRow) {
    if (!window.confirm(`Excluir o cupom ${coupon.code}?`)) return;
    setBusyId(coupon.id);
    try {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(coupon.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String((data as { detail?: string }).detail ?? "Falha ao excluir"));
      }
      toast.success("Cupom removido");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cupom");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading || viewMode === "pending") return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      {coupons.length === 0 && total === 0 ? (
        <CouponEmptyState />
      ) : viewMode === "cards" ? (
        <CouponCards
          coupons={coupons}
          onEdit={setEditing}
          onToggleActive={(c) => void toggleActive(c)}
          onDelete={(c) => void deleteCoupon(c)}
          busyId={busyId}
        />
      ) : (
        <CouponDesktopView
          coupons={coupons}
          onEdit={setEditing}
          onToggleActive={(c) => void toggleActive(c)}
          onDelete={(c) => void deleteCoupon(c)}
          busyId={busyId}
        />
      )}

      {onPageChange && (
        <CouponPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}

      {editing && (
        <CouponEditModal
          storeId={storeId}
          coupon={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSaved={onUpdated}
        />
      )}
    </div>
  );
}
