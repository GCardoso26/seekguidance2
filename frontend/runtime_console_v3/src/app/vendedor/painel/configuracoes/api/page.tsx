"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature, resolveSellerPlan } from "@/lib/seller-plans";

export default function SellerApiPage() {
  const { hasStore, dashboard } = useSellerStore();
  const plan = resolveSellerPlan(
    (dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan as string | undefined,
  );
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["dev-api-usage"],
    queryFn: async () => {
      const res = await fetch("/api/developer/usage");
      if (!res.ok) return null;
      return res.json() as Promise<Record<string, unknown>>;
    },
    enabled: planHasFeature(plan, "api"),
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/developer/api-keys", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao criar chave");
      return res.json() as Promise<{ apiKey?: string }>;
    },
    onSuccess: (payload) => {
      setNewKey(payload.apiKey ?? null);
      void refetch();
    },
  });

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-muted-foreground">
        <Link href="/vender" className="text-primary underline">
          Solicitar credenciamento
        </Link>
      </main>
    );
  }

  if (!planHasFeature(plan, "api")) {
    return (
      <main className="p-8 text-center">
        <p className="text-muted-foreground">API lojista no plano Pro.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <SellerHeader />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-bold">API da loja</h2>
          <p className="text-sm text-muted-foreground">
            Integre estoque e pedidos. Documentação em{" "}
            <a
              href="https://github.com/GCardoso26/seekguidance2/blob/main/docs/SELLER_API.md"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              SELLER_API.md
            </a>
          </p>
        </div>

        {data && (
          <div className="surface-card p-4 text-sm">
            <p>Prefixo: {String(data.key_prefix ?? "—")}</p>
            <p>Uso: {String(data.usage_count ?? 0)} / {String(data.rate_limit_monthly ?? "—")}</p>
          </div>
        )}

        <Button disabled={createKey.isPending} onClick={() => void createKey.mutate()}>
          {createKey.isPending ? "Gerando…" : "Gerar nova API key"}
        </Button>

        {newKey && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 text-sm">
            <p className="font-semibold text-warning">Copie agora — não será exibida de novo:</p>
            <code className="mt-2 block break-all font-mono text-xs">{newKey}</code>
          </div>
        )}
      </main>
    </>
  );
}
