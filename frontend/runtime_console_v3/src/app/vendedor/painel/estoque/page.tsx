"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  AsyncPageBody,
  PageEmpty,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/async-state";
import { useSellerStore } from "@/hooks/useSellerStore";

const CSV_TEMPLATE = `name,category,price_cents,stock,sku,description
Booster Set X,booster,1990,24,BOOST-001,Display lacrado
Sleeves Premium,sleeve,3490,50,SLV-01,65 unidades
`;

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EstoquePage() {
  const { storeId, hasStore, isLoading: storeLoading } = useSellerStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const {
    data,
    isLoading: loadingInv,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["seller-inventory", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/inventory`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
  });

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/inventory/import-csv`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Falha na importação"));
      }
      return payload as { imported: number; skipped: number; errors: string[] };
    },
    onSuccess: (result) => {
      setImportResult(result);
      void qc.invalidateQueries({ queryKey: ["seller-inventory", storeId] });
    },
  });

  async function handleFile(file: File) {
    const csv = await file.text();
    importMutation.mutate(csv);
  }

  if (storeLoading) {
    return (
      <PageShell>
        <PageSkeleton rows={4} />
      </PageShell>
    );
  }

  if (!hasStore) {
    return (
      <PageShell>
        <PageEmpty
          variant="panel"
          title="Você ainda não tem uma loja cadastrada"
          action={{ label: "Cadastrar loja", href: "/stores/create" }}
        />
      </PageShell>
    );
  }

  const products = data?.products ?? {};
  const listings = data?.listings ?? {};
  const lowStock = (data?.low_stock_products ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <SellerHeader />
      <PageShell className="space-y-6">
        <PageHeader
          title="Estoque"
          description="Produtos físicos e listagens de cartas."
        />

        <AsyncPageBody
          isLoading={loadingInv}
          isError={isError}
          onRetry={() => void refetch()}
          errorMessage="Não foi possível carregar o estoque."
          skeletonRows={4}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Produtos ativos", value: products.active_products ?? products.total_products ?? 0 },
              { label: "Sem estoque", value: products.out_of_stock ?? 0 },
              { label: "Estoque baixo", value: products.low_stock ?? 0 },
              { label: "Valor em estoque", value: formatBRL(Number(products.inventory_value_cents ?? 0)) },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase text-luxury-mist">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold">Importar produtos (CSV)</h3>
            <p className="text-sm text-luxury-mist">
              Colunas: name, category, price_cents, stock, sku, description. Categorias: booster, sleeve,
              deck_box, playmat, accessory, single.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {importMutation.isPending ? "Importando…" : "Selecionar CSV"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "estoque-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Baixar modelo
              </Button>
            </div>
            {importMutation.isError && (
              <InlineAlert
                message={
                  importMutation.error instanceof Error
                    ? importMutation.error.message
                    : "Erro na importação"
                }
              />
            )}
            {importResult && (
              <p className="text-sm text-emerald-300">
                {importResult.imported} importado(s), {importResult.skipped} ignorado(s).
                {importResult.errors.length > 0 && (
                  <span className="mt-1 block text-amber-200">
                    {importResult.errors.slice(0, 3).join(" · ")}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold">Listagens de cartas</h3>
            <p className="mt-2 text-sm text-luxury-mist">
              {listings.active_listings ?? 0} listagens ativas · {listings.total_cards ?? 0} cartas ·{" "}
              {formatBRL(Number(listings.listings_value_cents ?? 0))} em valor
            </p>
            <Link href="/vendedor/painel/listagens" className="mt-3 inline-block text-sm text-luxury-gold underline">
              Gerenciar listagens
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Produtos com estoque baixo</h3>
            {lowStock.length === 0 ? (
              <p className="text-sm text-luxury-mist">Nenhum produto com estoque crítico.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {lowStock.map((p) => (
                  <li key={String(p.id)} className="flex justify-between py-2 text-sm">
                    <span>{String(p.name)}</span>
                    <span className="text-amber-300">{String(p.stock)} un.</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AsyncPageBody>
      </PageShell>
    </>
  );
}
