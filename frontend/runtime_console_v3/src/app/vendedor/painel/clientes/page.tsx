"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

const SEGMENT_LABELS: Record<string, string> = {
  high_spender: "Alto valor",
  frequent: "Frequente",
  new: "Novo",
  inactive: "Inativo",
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientesPage() {
  const { storeId, hasStore, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["seller-crm", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/crm/customers`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ customers: Array<Record<string, unknown>> }>;
    },
    enabled: Boolean(storeId) && planHasFeature(plan, "crm"),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/crm/sync`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("sync_failed");
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller-crm", storeId] }),
  });

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!planHasFeature(plan, "crm")) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">CRM disponível no plano Lojista.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  const customers = data?.customers ?? [];

  return (
    <>
      <SellerHeader
        action={
          <Button
            variant="outline"
            disabled={syncMutation.isPending}
            onClick={() => void syncMutation.mutate()}
          >
            {syncMutation.isPending ? "Sincronizando…" : "Sincronizar pedidos"}
          </Button>
        }
      />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-xl font-bold">Clientes</h2>
          <p className="text-sm text-luxury-mist">Histórico e segmentação básica.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-luxury-mist">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Pedidos</th>
                <th className="p-3">Total gasto</th>
                <th className="p-3">Segmento</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-luxury-mist">
                    Carregando…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-luxury-mist">
                    Nenhum cliente. Clique em sincronizar após vendas pagas.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={String(c.customer_id)} className="border-t border-white/10">
                    <td className="p-3">
                      <p>{String(c.display_name || c.email || c.customer_id)}</p>
                      {Boolean(c.email) && <p className="text-xs text-luxury-mist">{String(c.email)}</p>}
                    </td>
                    <td className="p-3">{String(c.order_count)}</td>
                    <td className="p-3">{formatBRL(Number(c.total_spent_cents ?? 0))}</td>
                    <td className="p-3">
                      {SEGMENT_LABELS[String(c.segment)] ?? String(c.segment)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
