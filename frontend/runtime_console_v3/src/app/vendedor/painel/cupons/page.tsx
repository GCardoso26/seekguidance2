"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CouponCreateModal } from "@/components/seller-dashboard/CouponCreateModal";
import { CouponManager } from "@/components/seller-dashboard/CouponManager";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerCoupons } from "@/hooks/useSellerCoupons";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function CuponsPage() {
  const { storeId, hasStore } = useSellerStore();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useSellerCoupons({
    storeId,
    page,
    limit: 20,
    enabled: hasStore,
  });

  function onUpdated() {
    void qc.invalidateQueries({ queryKey: ["seller-coupons", storeId] });
    void refetch();
  }

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  return (
    <>
      <SellerHeader
        action={
          <Button data-testid="coupon-new-btn" onClick={() => setCreateOpen(true)}>
            Novo cupom
          </Button>
        }
      />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h1 className="text-xl font-bold">Cupons</h1>
          <p className="text-sm text-luxury-mist">Descontos por loja no checkout PIX.</p>
        </div>

        {storeId && (
          <CouponManager
            storeId={storeId}
            coupons={data?.coupons ?? []}
            isLoading={isLoading}
            page={page}
            total={data?.total ?? 0}
            limit={20}
            onPageChange={setPage}
            onUpdated={onUpdated}
          />
        )}
      </main>

      {storeId && (
        <CouponCreateModal
          storeId={storeId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setCreateOpen(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
