"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  useCustomerGamification,
  useSellerCustomers,
  type SellerCustomerRow,
} from "@/hooks/useSellerCustomers";
import { formatShopPrice } from "@/lib/marketplace-shop";

const TABS = [
  "Histórico",
  "Pedidos",
  "Tickets",
  "Mensagens",
  "Endereço",
  "Wishlist",
  "Cartas Favoritas",
  "Gamificação",
] as const;

function formatRelative(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "1d";
  return `${days}d`;
}

function CustomerDetailDrawer({
  customer,
  open,
  onOpenChange,
}: {
  customer: SellerCustomerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Histórico");
  const { data: gamData } = useCustomerGamification(customer?.customer_id ?? null, open && tab === "Gamificação");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-luxury-onyx shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              {customer?.display_name ?? "Cliente"}
              {customer?.handle ? ` (@${customer.handle})` : ""}
            </Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {customer && (
            <>
              <div className="border-b border-white/10 px-4 py-3 text-sm text-luxury-mist">
                {customer.email && <p>{customer.email}</p>}
                {customer.city && <p>{customer.city}</p>}
                <p className="mt-1 text-white">
                  Total: {formatShopPrice(customer.total_spent_cents)} · {customer.order_count} pedidos
                </p>
              </div>
              <div className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-2">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded px-2 py-1 text-xs ${
                      tab === t ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-sm">
                {tab === "Gamificação" && (
                  <div data-testid="customer-gamification">
                    <p>
                      Nível:{" "}
                      <strong>{String(gamData?.gamification?.level ?? 1)}</strong>
                    </p>
                    <p>XP: {String(gamData?.gamification?.total_xp ?? 0)}</p>
                    {gamData?.badges?.length ? (
                      <ul className="mt-2 space-y-1">
                        {gamData.badges.map((b: { code: string; name: string }) => (
                          <li key={b.code}>🏅 {b.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-luxury-mist">Nenhum badge ainda.</p>
                    )}
                  </div>
                )}
                {tab !== "Gamificação" && (
                  <p className="text-luxury-mist">Conteúdo de {tab} em breve.</p>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CustomersPage() {
  const searchParams = useSearchParams();
  const customerParam = searchParams.get("customer");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<SellerCustomerRow | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useSellerCustomers(debounced);

  useEffect(() => {
    if (!customerParam || !data?.customers?.length) return;
    const match = data.customers.find((c) => c.customer_id === customerParam);
    if (match) setSelected(match);
  }, [customerParam, data?.customers]);

  return (
    <>
      <SellerHeader action={null} />
      <PageShell>
        <PageHeader title="Clientes" description="Histórico de compras e relacionamento." />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, Email, Handle…"
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-luxury-mist">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Total gasto</th>
                  <th className="p-3">Pedidos</th>
                  <th className="p-3">Última</th>
                </tr>
              </thead>
              <tbody>
                {(data?.customers ?? []).map((c) => (
                  <tr
                    key={c.customer_id}
                    className="cursor-pointer border-t border-white/10 hover:bg-white/[0.03]"
                    onClick={() => setSelected(c)}
                  >
                    <td className="p-3">{c.display_name ?? c.customer_id.slice(0, 8)}</td>
                    <td className="p-3">{c.email ?? "—"}</td>
                    <td className="p-3">{c.city ?? "—"}</td>
                    <td className="p-3">{formatShopPrice(c.total_spent_cents)}</td>
                    <td className="p-3">{c.order_count}</td>
                    <td className="p-3">{formatRelative(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
      <CustomerDetailDrawer
        customer={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
