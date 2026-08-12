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

const CSV_TEMPLATE_PRODUCTS = `name,category,price_cents,stock,sku,description
Booster Set X,booster,1990,24,BOOST-001,Display lacrado
Sleeves Premium,sleeve,3490,50,SLV-01,65 unidades
`;

const CSV_TEMPLATE_CARDS = `sku,name,set,condition,language,price,quantity,game
SKU-001,Elsa - Snow Queen,TFC,NM,en,15.90,2,lorcana
SKU-002,Lightning Bolt,LEA,LP,en,8900,1,mtg
`;

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EstoquePage() {
  const { storeId, hasStore, isLoading: storeLoading } = useSellerStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cardsFileRef = useRef<HTMLInputElement>(null);
  const [importKind, setImportKind] = useState<"products" | "cards">("products");
  const [importResult, setImportResult] = useState<{
    imported?: number;
    matched?: number;
    skipped?: number;
    unmatched_count?: number;
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
    mutationFn: async ({ csv, kind }: { csv: string; kind: "products" | "cards" }) => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/inventory/import-csv`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv, kind }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Falha na importação"));
      }
      return payload as {
        imported?: number;
        matched?: number;
        skipped?: number;
        unmatched_count?: number;
        errors: string[];
      };
    },
    onSuccess: (result) => {
      setImportResult(result);
      void qc.invalidateQueries({ queryKey: ["seller-inventory", storeId] });
    },
  });

  async function handleFile(file: File, kind: "products" | "cards") {
    const csv = await file.text();
    setImportKind(kind);
    importMutation.mutate({ csv, kind });
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
          title="Você ainda não tem uma loja credenciada"
          action={{ label: "Solicitar credenciamento", href: "/vender" }}
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
        <PageHeader title="Estoque" description="Produtos físicos e listagens de cartas." />

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
              <div key={kpi.label} className="surface-card p-4">
                <p className="text-xs uppercase text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 surface-card p-4">
            <h3 className="font-semibold">Importar singles → Master Catalog</h3>
            <p className="text-sm text-muted-foreground">
              Colunas: sku,name,set,condition,language,price,quantity[,game]. Match no catálogo e cria
              oferta (preço/qty/condição).
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={cardsFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file, "cards");
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => cardsFileRef.current?.click()}
              >
                {importMutation.isPending && importKind === "cards" ? "Importando…" : "CSV de cartas"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadCsv(CSV_TEMPLATE_CARDS, "catalogo-singles-template.csv")}
              >
                Baixar modelo cartas
              </Button>
            </div>
          </div>

          <div className="space-y-3 surface-card p-4">
            <h3 className="font-semibold">Importar produtos físicos (CSV)</h3>
            <p className="text-sm text-muted-foreground">
              Colunas: name, category, price_cents, stock, sku, description.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file, "products");
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {importMutation.isPending && importKind === "products"
                  ? "Importando…"
                  : "Selecionar CSV"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadCsv(CSV_TEMPLATE_PRODUCTS, "estoque-template.csv")}
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
              <p className="text-sm text-success">
                {importResult.imported ?? 0} importado(s)
                {importResult.matched != null ? ` · matched ${importResult.matched}` : ""}
                {importResult.skipped != null ? ` · ignorados ${importResult.skipped}` : ""}
                {importResult.unmatched_count != null
                  ? ` · sem match ${importResult.unmatched_count}`
                  : ""}
                {importResult.errors?.length > 0 && (
                  <span className="mt-1 block text-warning">
                    {importResult.errors.slice(0, 3).join(" · ")}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="surface-card p-4">
            <h3 className="font-semibold">Listagens de cartas</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {listings.active_listings ?? 0} listagens ativas · {listings.total_cards ?? 0} cartas ·{" "}
              {formatBRL(Number(listings.listings_value_cents ?? 0))} em valor
            </p>
            <Link
              href="/vendedor/painel/listagens"
              className="mt-3 inline-block text-sm text-primary underline"
            >
              Gerenciar listagens
            </Link>
          </div>

          <div className="surface-card p-4">
            <h3 className="mb-3 font-semibold">Produtos com estoque baixo</h3>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto com estoque crítico.</p>
            ) : (
              <ul className="divide-y divide-border">
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
