"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinanceReconciliation } from "@/hooks/useSellerFinanceS6";
import { formatShopPrice } from "@/lib/marketplace-shop";

const STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  missing_order: "Pedido ausente",
  order_not_paid: "Pedido não pago",
  amount_mismatch: "Valor divergente",
  dispute_mismatch: "Disputa divergente",
  transfer_pending: "Transfer pendente",
  auto_fixed_order: "Corrigido",
};

export function ReconciliationPage() {
  const { data, isLoading } = useFinanceReconciliation();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader
          title="Reconciliação"
          description="Comparação Payment aggregate vs pedidos e repasses Stripe."
        />
        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <>
            <div className="flex gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-luxury-mist">Total analisado</p>
                <p className="text-xl font-semibold">{data?.total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-luxury-mist">Divergências</p>
                <p className={`text-xl font-semibold ${data?.healthy ? "text-emerald-400" : "text-amber-400"}`}>
                  {data?.issues_count ?? 0}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-luxury-mist">
                  <tr>
                    <th className="p-3">Pedido</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((row) => (
                    <tr key={row.payment_id} className="border-b border-white/5">
                      <td className="p-3 font-mono text-xs">{row.shop_order_id?.slice(0, 8) ?? "—"}</td>
                      <td className="p-3">{row.payment_status}</td>
                      <td className="p-3">{formatShopPrice(row.payment_amount)}</td>
                      <td className="p-3">
                        <span
                          className={
                            row.reconciliation_status === "ok"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }
                        >
                          {STATUS_LABELS[row.reconciliation_status] ?? row.reconciliation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}
