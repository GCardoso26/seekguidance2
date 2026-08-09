"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { StoreReviewsManager } from "@/components/store/StoreReviewsManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSellerStore } from "@/hooks/useSellerStore";
import { digitsOnlyCep, formatCepMask } from "@/lib/geo/sp-distance";

export default function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { storeId, store, dashboard, refetchDashboard } = useSellerStore();
  const dashStore = dashboard?.store as Record<string, unknown> | undefined;

  const { data: settings } = useQuery({
    queryKey: ["seller-settings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/settings");
      if (!res.ok) throw new Error("settings_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const storeData = (settings?.store ?? dashStore ?? store) as Record<string, unknown> | undefined;

  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!storeData) return;
    setCity(String(storeData.city ?? ""));
    setStateUf(String(storeData.state ?? ""));
    setPostalCode(formatCepMask(String(storeData.postal_code ?? "")));
    setPhone(String(storeData.phone ?? ""));
  }, [storeData]);

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return;
    const cep = digitsOnlyCep(postalCode);
    if (cep && cep.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }
    if (stateUf && stateUf.trim().length !== 2) {
      toast.error("UF deve ter 2 letras");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/id/${encodeURIComponent(storeId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim() || null,
          state: stateUf.trim().toUpperCase() || null,
          postal_code: cep || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((data as { detail?: string }).detail ?? "Falha ao salvar"));
      }
      toast.success("Endereço da loja atualizado");
      void qc.invalidateQueries({ queryKey: ["seller-settings"] });
      void qc.invalidateQueries({ queryKey: ["my-stores"] });
      void refetchDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

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
          <h3 className="font-semibold">Endereço e contato</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Usado para pré-preencher ingressos de eventos e exibir distância no hub.
          </p>
          <form onSubmit={(e) => void saveAddress(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="store-city" className="text-sm text-muted-foreground">
                Cidade
              </label>
              <Input
                id="store-city"
                className="mt-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                data-testid="store-city-input"
              />
            </div>
            <div>
              <label htmlFor="store-state" className="text-sm text-muted-foreground">
                Estado (UF)
              </label>
              <Input
                id="store-state"
                className="mt-1 uppercase"
                maxLength={2}
                value={stateUf}
                onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                data-testid="store-state-input"
              />
            </div>
            <div>
              <label htmlFor="store-cep" className="text-sm text-muted-foreground">
                CEP
              </label>
              <Input
                id="store-cep"
                className="mt-1"
                placeholder="00000-000"
                value={postalCode}
                onChange={(e) => setPostalCode(formatCepMask(e.target.value))}
                data-testid="store-cep-input"
              />
            </div>
            <div>
              <label htmlFor="store-phone" className="text-sm text-muted-foreground">
                Telefone
              </label>
              <Input
                id="store-phone"
                className="mt-1"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="store-phone-input"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving || !storeId} data-testid="store-address-save">
                {saving ? "Salvando…" : "Salvar endereço"}
              </Button>
            </div>
          </form>
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
