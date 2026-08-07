"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ProCheckout } from "@/components/store/ProCheckout";
import { ProBadge } from "@/components/store/ProBadge";

const BENEFITS = [
  "Produtos ilimitados no marketplace",
  "Torneios sem limite de jogadores",
  "Analytics avançado",
  "Suporte prioritário",
  "Zero comissão — PIX direto ao lojista",
];

function ProPageContent() {
  const [storeId, setStoreId] = useState<string | null>(null);

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

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["store-dashboard", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}`);
      if (!res.ok) throw new Error("Sem acesso");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const store = dashboard?.store as Record<string, unknown> | undefined;
  const plan = String(store?.subscription_plan ?? "free");

  if (!storeId) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-muted-foreground">Cadastre uma loja para assinar o Pro.</p>
        <Link href="/vendedor/painel/onboarding" className="mt-4 inline-block text-primary underline">
          Criar loja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Pro Loja</h1>
          <ProBadge plan={plan} />
        </div>
        <p className="mt-2 text-muted-foreground">
          Receita da plataforma via assinatura — sem comissão sobre suas vendas.
        </p>
      </div>

      <ul className="space-y-2">
        {BENEFITS.map((b) => (
          <li key={b} className="text-sm text-muted-foreground">
            ✓ {b}
          </li>
        ))}
      </ul>

      {plan === "free" ? (
        <ProCheckout storeId={storeId} onSuccess={() => void refetch()} />
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-6">
          <p className="font-semibold">Assinatura ativa</p>
          <Link href="/vendedor/painel/configuracoes/pagamentos" className="mt-2 inline-block text-sm text-primary underline">
            Gerenciar em Pagamentos
          </Link>
        </div>
      )}
    </div>
  );
}

export default function StoreProPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
          <ProPageContent />
        </Suspense>
      </div>
    </MobileLayout>
  );
}
