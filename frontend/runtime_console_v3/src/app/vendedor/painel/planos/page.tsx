"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PlanCheckout } from "@/components/store/PlanCheckout";
import { ProBadge } from "@/components/store/ProBadge";
import { useSellerStore } from "@/hooks/useSellerStore";
import { SELLER_PLANS, formatPlanPrice, planLabel, resolveSellerPlan } from "@/lib/seller-plans";

export default function PlanosPage() {
  const { storeId, hasStore, dashboard, refetchDashboard } = useSellerStore();
  const plan = resolveSellerPlan(
    (dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan as string | undefined,
  );

  const { data: storeData } = useQuery({
    queryKey: ["store-plan", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const currentPlan = String(storeData?.store?.subscription_plan ?? plan);
  const needsPaid = ["free", "pending_accreditation"].includes(currentPlan);

  if (!hasStore || !storeId) {
    return (
      <main className="p-8 text-center">
        <p className="text-muted-foreground">Solicite credenciamento da sua hobby store para assinar um plano.</p>
        <Link href="/vender" className="mt-4 inline-block text-primary underline">
          Vender no JudgeTCG
        </Link>
      </main>
    );
  }

  return (
    <>
      <SellerHeader />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Planos da loja</h2>
          <ProBadge plan={currentPlan} />
        </div>
        <p className="text-sm text-muted-foreground">
          Plano atual: <strong>{planLabel(currentPlan)}</strong> — receita via assinatura, sem comissão
          sobre vendas. Não há plano gratuito para vendedores (ADR-018).
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SELLER_PLANS.map((p) => {
            const active = currentPlan === p.id;
            const canUpgradeToLojista = needsPaid && p.id === "lojista";
            const canUpgradeToPro =
              p.id === "pro" && ["free", "pending_accreditation", "lojista"].includes(currentPlan);
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 ${active ? "border-primary bg-primary/10" : "border-border bg-muted/50"}`}
              >
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold text-primary">{formatPlanPrice(p.priceCents)}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                {active && <p className="mt-3 text-xs text-primary">Plano ativo</p>}
                {!active && canUpgradeToLojista && (
                  <div className="mt-4">
                    <PlanCheckout storeId={storeId} plan="lojista" onSuccess={() => void refetchDashboard()} />
                  </div>
                )}
                {!active && canUpgradeToPro && (
                  <div className="mt-4">
                    <PlanCheckout storeId={storeId} plan="pro" onSuccess={() => void refetchDashboard()} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
