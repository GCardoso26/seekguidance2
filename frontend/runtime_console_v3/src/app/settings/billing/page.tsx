"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCustomerPortal, useSubscription } from "@/hooks/useSubscription";
import { FEATURE_LABELS } from "@/lib/subscription/features";

function BillingContent() {
  const { tier, status, currentPeriodEnd, features, isLoading, isPro } = useSubscription();
  const portal = useCustomerPortal();

  if (isLoading) {
    return <p className="text-muted-foreground">A carregar faturação...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Faturação</h1>
        <Link href="/pricing" className="text-sm text-primary hover:underline">
          Ver planos
        </Link>
      </div>

      <div className="rounded-xl border border-[#2d2d44] bg-muted/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Plano atual</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold capitalize text-primary">{tier}</p>
            <p className="text-muted-foreground">
              Estado: <span className="capitalize text-foreground">{status}</span>
            </p>
            {currentPeriodEnd && (
              <p className="text-muted-foreground">
                Próximo ciclo: {new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          {isPro && (
            <Button
              type="button"
              variant="outline"
              className="border-primary/50 text-primary"
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

      <div className="rounded-xl border border-[#2d2d44] bg-muted/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Funcionalidades</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(features).map(([key, enabled]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className={enabled ? "text-primary" : "text-muted-foreground/50"}>
                {enabled ? "✓" : "✗"}
              </span>
              <span className={enabled ? "text-foreground" : "text-muted-foreground/70"}>
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
  return <BillingContent />;
}
