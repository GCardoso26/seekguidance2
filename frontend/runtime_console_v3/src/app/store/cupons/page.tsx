"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CouponForm } from "@/components/coupons/CouponForm";
import { CouponList } from "@/components/coupons/CouponList";

function CuponsContent() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: storesData } = useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      const res = await fetch("/api/stores/mine");
      if (!res.ok) return [];
      return res.json() as Promise<Array<Record<string, unknown>>>;
    },
  });

  useEffect(() => {
    if (storesData?.[0]?.id) setStoreId(String(storesData[0].id));
  }, [storesData]);

  const { data, refetch } = useQuery({
    queryKey: ["store-coupons", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/coupons`);
      if (!res.ok) return { coupons: [] };
      return res.json() as Promise<{ coupons: Array<Record<string, unknown>> }>;
    },
    enabled: Boolean(storeId),
  });

  async function deactivate(couponId: string) {
    if (!storeId) return;
    await fetch(
      `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(couponId)}/deactivate`,
      { method: "POST" },
    );
    void refetch();
  }

  if (!storeId) {
    return (
      <p className="text-muted-foreground">
        <Link href="/vendedor/painel/onboarding" className="text-primary underline">
          Crie uma loja
        </Link>{" "}
        para gerenciar cupons.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <CouponForm storeId={storeId} onCreated={() => void refetch()} />
      <div>
        <h2 className="mb-4 font-semibold">Seus cupons</h2>
        <CouponList
          coupons={(data?.coupons ?? []) as never}
          onDeactivate={(id) => void deactivate(id)}
        />
      </div>
    </div>
  );
}

export default function StoreCuponsPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/vendedor/painel" className="text-sm text-muted-foreground">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Cupons</h1>
        <Suspense fallback={<p className="mt-4 text-muted-foreground">Carregando…</p>}>
          <div className="mt-6">
            <CuponsContent />
          </div>
        </Suspense>
      </div>
    </MobileLayout>
  );
}
