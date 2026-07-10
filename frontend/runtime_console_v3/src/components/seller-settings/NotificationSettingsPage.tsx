"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useNotificationSettings } from "@/hooks/useSellerFinance";

const EVENTS: { key: string; label: string }[] = [
  { key: "new_order", label: "Novo pedido" },
  { key: "payment_received", label: "Pagamento recebido" },
  { key: "ticket_created", label: "Ticket criado" },
  { key: "low_stock", label: "Estoque baixo" },
  { key: "daily_summary", label: "Resumo diário" },
];

const CHANNELS = ["email", "push"] as const;

export function NotificationSettingsPage() {
  const { data: settings, isLoading } = useNotificationSettings();
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async (next: Record<string, string[]>) => {
      const res = await fetch("/api/seller/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: next }),
      });
      if (!res.ok) throw new Error("save_failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-notification-settings"] }),
  });

  function toggle(eventKey: string, channel: string) {
    if (!settings) return;
    const current = settings[eventKey] ?? [];
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    save.mutate({ ...settings, [eventKey]: next });
  }

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/vendedor/painel/configuracoes" className="hover:text-white">
            Configurações
          </Link>
          <span>/</span>
          <span className="text-white">Notificações</span>
        </div>
        <h2 className="text-xl font-bold">Notificações da loja</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-4" data-testid="notification-settings">
            {EVENTS.map((ev) => (
              <section key={ev.key} className="surface-card p-4">
                <h3 className="font-medium">{ev.label}</h3>
                <div className="mt-2 flex gap-4">
                  {CHANNELS.map((ch) => (
                    <label key={ch} className="flex items-center gap-2 text-sm capitalize">
                      <input
                        type="checkbox"
                        checked={(settings?.[ev.key] ?? []).includes(ch)}
                        onChange={() => toggle(ev.key, ch)}
                      />
                      {ch === "email" ? "E-mail" : "Push"}
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
