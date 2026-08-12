"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CouponCreateModal } from "@/components/seller-dashboard/CouponCreateModal";
import { CouponManager } from "@/components/seller-dashboard/CouponManager";
import {
  AsyncPageBody,
  PageEmpty,
  PageError,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerCoupons } from "@/hooks/useSellerCoupons";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function CuponsPage() {
  const { storeId, hasStore, isLoading: storeLoading } = useSellerStore();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useSellerCoupons({
    storeId,
    page,
    limit: 20,
    enabled: hasStore,
  });

  function onUpdated() {
    void qc.invalidateQueries({ queryKey: ["seller-coupons", storeId] });
    void refetch();
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
          title="Cadastre sua loja para gerenciar cupons"
          action={{ label: "Cadastrar loja", href: "/vender" }}
        />
      </PageShell>
    );
  }

  if (error instanceof Error && error.message === "login_required") {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Faça login para gerenciar cupons"
          action={{ label: "Entrar", href: "/entrar?next=/vendedor/painel/cupons" }}
        />
      </PageShell>
    );
  }

  const couponErrorMessage =
    error instanceof Error && error.message === "plan_forbidden"
      ? "Seu plano não permite cupons. Veja opções em Planos."
      : "Não foi possível carregar os cupons.";

  return (
    <>
      <SellerHeader
        action={
          <Button data-testid="coupon-new-btn" onClick={() => setCreateOpen(true)}>
            Novo cupom
          </Button>
        }
      />
      <PageShell className="space-y-6">
        <PageHeader
          title="Cupons"
          description="Descontos por loja no checkout PIX."
        />

        {isError ? (
          <PageError message={couponErrorMessage} onRetry={() => void refetch()} />
        ) : (
          <AsyncPageBody isLoading={isLoading} skeletonRows={5}>
            {storeId && (
              <CouponManager
                storeId={storeId}
                coupons={data?.coupons ?? []}
                isLoading={false}
                page={page}
                total={data?.total ?? 0}
                limit={20}
                onPageChange={setPage}
                onUpdated={onUpdated}
              />
            )}
          </AsyncPageBody>
        )}
      </PageShell>

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
