"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCustomerPortal, useSubscription } from "@/hooks/useSubscription";
import { FEATURE_LABELS } from "@/lib/subscription/features";

function BillingContent() {
  const { tier, status, currentPeriodEnd, features, isLoading, isPro } = useSubscription();
  const portal = useCustomerPortal();

  if (isLoading) {
    return <p className="text-slate-400">A carregar faturação...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Faturação</h1>
        <Link href="/pricing" className="text-sm text-emerald-400 hover:underline">
          Ver planos
        </Link>
      </div>

      <div className="rounded-xl border border-[#2d2d44] bg-slate-900/80 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Plano atual</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold capitalize text-emerald-400">{tier}</p>
            <p className="text-slate-400">
              Estado: <span className="capitalize text-white">{status}</span>
            </p>
            {currentPeriodEnd && (
              <p className="text-slate-400">
                Próximo ciclo: {new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          {isPro && (
            <Button
              type="button"
              variant="outline"
              className="border-amber-500/50 text-amber-300"
              onClick={() =>
                portal.mutate(undefined, {
                  onSuccess: (data) => {
                    if (data.url) window.location.href = data.url;
                  },
                })
              }
              disabled={portal.isPending}
            >
              {portal.isPending ? "A abrir..." : "Gerir no Stripe"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#2d2d44] bg-slate-900/80 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Funcionalidades</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(features).map(([key, enabled]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className={enabled ? "text-emerald-400" : "text-slate-600"}>
                {enabled ? "✓" : "✗"}
              </span>
              <span className={enabled ? "text-white" : "text-slate-500"}>
                {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0]">
      <BillingContent />
    </div>
  );
}
