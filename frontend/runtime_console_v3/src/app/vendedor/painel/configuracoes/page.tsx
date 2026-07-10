"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { StoreReviewsManager } from "@/components/store/StoreReviewsManager";
import { useSellerStore } from "@/hooks/useSellerStore";

export default function ConfiguracoesPage() {
  const { storeId, dashboard } = useSellerStore();
  const store = dashboard?.store as Record<string, unknown> | undefined;

  const { data: settings } = useQuery({
    queryKey: ["seller-settings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/settings");
      if (!res.ok) throw new Error("settings_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const storeData = (settings?.store ?? store) as Record<string, unknown> | undefined;

  return (
    <>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <h2 className="text-xl font-bold">Configurações da loja</h2>

        <section className="surface-card p-6">
          <h3 className="font-semibold">Dados da loja</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Nome: <strong>{String(storeData?.name ?? "—")}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Slug: <strong>{String(storeData?.slug ?? "—")}</strong>
          </p>
        </section>

        <section className="surface-card p-6">
          <h3 className="font-semibold">Notificações</h3>
          <p className="mt-2 text-sm text-muted-foreground">E-mail e push para eventos da loja.</p>
          <Link
            href="/vendedor/painel/configuracoes/notificacoes"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Configurar notificações →
          </Link>
        </section>

        <section className="surface-card p-6">
          <h3 className="font-semibold">Pagamento</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            PIX: {storeData?.pix_key ? "Configurado" : "Pendente"}
          </p>
          <Link
            href="/vendedor/painel/configuracoes/pagamentos"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Configurar pagamentos →
          </Link>
        </section>

        <section className="surface-card p-6">
          <h3 className="font-semibold">Frete</h3>
          <Link
            href="/vendedor/painel/configuracoes/frete"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Configurar frete →
          </Link>
        </section>

        <section className="surface-card p-6">
          <h3 className="font-semibold">API (Pro)</h3>
          <p className="mt-2 text-sm text-muted-foreground">Integração REST para estoque e pedidos.</p>
          <Link
            href="/vendedor/painel/configuracoes/api"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Gerenciar API keys →
          </Link>
        </section>

        {storeId && (
          <section className="surface-card p-6">
            <h3 className="mb-3 font-semibold">Avaliações</h3>
            <StoreReviewsManager storeId={storeId} />
          </section>
        )}
      </main>
    </>
  );
}
