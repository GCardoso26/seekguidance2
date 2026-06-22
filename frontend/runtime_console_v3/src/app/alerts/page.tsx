"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { AlertCard } from "@/components/alerts/AlertCard";
import { Button } from "@/components/ui/button";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";

export default function AlertsPage() {
  const { data: alerts = [], isLoading, error } = usePriceAlerts();

  if (error instanceof Error && error.message === "login_required") {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Meus alertas de preço</h1>
          <p className="mt-2 text-muted-foreground">Faça login para ver seus alertas.</p>
          <Button asChild className="mt-6">
            <Link href="/login?next=/alerts">Entrar</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/catalog/search" className="text-sm text-muted-foreground hover:text-foreground">
          ← Catálogo
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Meus alertas de preço</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Você será notificado por e-mail e push quando o preço atingir seu alvo.
        </p>

        {isLoading && <p className="mt-8 text-muted-foreground">Carregando…</p>}

        {!isLoading && alerts.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">
            Nenhum alerta ainda. Abra uma carta e toque em &quot;Alerta&quot;.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <AlertCard alert={alert} />
            </li>
          ))}
        </ul>
      </main>
    </MobileLayout>
  );
}
