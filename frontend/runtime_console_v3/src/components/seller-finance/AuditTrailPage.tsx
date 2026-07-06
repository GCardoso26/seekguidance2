"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinanceAuditTrail } from "@/hooks/useSellerFinanceS6";
import { formatShopPrice } from "@/lib/marketplace-shop";

export function AuditTrailPage() {
  const { data, isLoading } = useFinanceAuditTrail();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader
          title="Audit trail"
          description="Histórico de transições do aggregate Payment."
        />
        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="space-y-2">
            {(data?.events ?? []).length === 0 ? (
              <p className="text-sm text-luxury-mist">Nenhum evento registrado ainda.</p>
            ) : (
              data?.events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <p className="font-medium">{ev.event_type ?? ev.to_status}</p>
                    <p className="text-xs text-luxury-mist">
                      {ev.from_status ?? "—"} → {ev.to_status}
                    </p>
                    <p className="mt-1 font-mono text-xs text-luxury-mist">
                      pedido {ev.shop_order_id?.slice(0, 8) ?? "—"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatShopPrice(ev.amount_cents)}</p>
                    <p className="text-xs text-luxury-mist">
                      {new Date(ev.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
}
