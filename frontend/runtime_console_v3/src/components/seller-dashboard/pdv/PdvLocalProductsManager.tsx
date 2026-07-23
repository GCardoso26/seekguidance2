"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { PdvLocalProductModal } from "@/components/seller-dashboard/pdv/PdvLocalProductModal";
import { Button } from "@/components/ui/button";
import {
  useDeletePdvLocalProduct,
  usePdvLocalProducts,
  usePdvLocalReport,
} from "@/hooks/usePdvLocalProducts";
import { formatShopPrice } from "@/lib/marketplace-shop";
import {
  PDV_LOCAL_CATEGORIES,
  pdvStockLabel,
  type PdvLocalProduct,
} from "@/types/pdv";

type Props = {
  storeId: string;
};

export function PdvLocalProductsManager({ storeId }: Props) {
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [lowStock, setLowStock] = useState(false);
  const [tab, setTab] = useState<"list" | "reports">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PdvLocalProduct | null>(null);

  const filters = useMemo(
    () => ({
      category: category || undefined,
      active: activeFilter === "all" ? null : activeFilter === "true",
      low_stock: lowStock,
    }),
    [category, activeFilter, lowStock],
  );

  const { data: products = [], isLoading, refetch } = usePdvLocalProducts(storeId, filters);
  const { data: report } = usePdvLocalReport(storeId, tab === "reports");
  const deleteMutation = useDeletePdvLocalProduct(storeId);

  async function handleDelete(p: PdvLocalProduct) {
    if (!confirm(`Desativar "${p.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(p.id);
      toast.success("Produto desativado");
    } catch {
      toast.error("Falha ao desativar");
    }
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Produtos Locais"
          description="Itens de conveniência e serviços só no PDV — fora do Marketplace e do catálogo."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/vendedor/painel/pdv">← Caixa</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            data-testid="pdv-local-new"
          >
            Novo produto
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "list" ? "default" : "outline"}
          onClick={() => setTab("list")}
        >
          Lista
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "reports" ? "default" : "outline"}
          onClick={() => setTab("reports")}
          data-testid="pdv-local-reports-tab"
        >
          Relatórios
        </Button>
      </div>

      {tab === "reports" ? (
        <div className="space-y-4" data-testid="pdv-local-reports">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Receita locais</p>
              <p className="mt-1 text-xl font-semibold">
                {formatShopPrice(report?.revenue_local_cents ?? 0)}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Receita oficiais</p>
              <p className="mt-1 text-xl font-semibold">
                {formatShopPrice(report?.revenue_official_cents ?? 0)}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Lucro locais</p>
              <p className="mt-1 text-xl font-semibold">
                {formatShopPrice(report?.profit_local_cents ?? 0)}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Margem</p>
              <p className="mt-1 text-xl font-semibold">{report?.margin_pct ?? 0}%</p>
            </div>
          </div>

          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold">Mais vendidos (locais)</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(report?.top_products ?? []).length === 0 && (
                <li className="text-muted-foreground">Sem vendas locais ainda.</li>
              )}
              {(report?.top_products ?? []).map((row) => (
                <li key={`${row.local_product_id}-${row.name}`} className="flex justify-between gap-2">
                  <span>
                    {row.name} · {row.quantity} un.
                  </span>
                  <span>{formatShopPrice(row.revenue_cents)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold">Estoque baixo</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {(report?.low_stock ?? []).length === 0 && (
                <li className="text-muted-foreground">Nenhum alerta de estoque.</li>
              )}
              {(report?.low_stock ?? []).map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.name}</span>
                  <span>
                    {pdvStockLabel(p.stock)} / mín {p.minimum_stock ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2" data-testid="pdv-local-filters">
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas categorias</option>
              {PDV_LOCAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as "all" | "true" | "false")}
            >
              <option value="all">Todos status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
            <label className="flex items-center gap-2 rounded-md border border-border px-3 text-sm">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => setLowStock(e.target.checked)}
              />
              Sem estoque / baixo
            </label>
          </div>

          <div className="overflow-x-auto surface-card" data-testid="pdv-local-table">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Preço</th>
                  <th className="px-3 py-2">Estoque</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                )}
                {!isLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                      Nenhum produto local.
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2">{formatShopPrice(p.price_cents)}</td>
                    <td className="px-3 py-2">{pdvStockLabel(p.stock)}</td>
                    <td className="px-3 py-2">{p.active ? "Ativo" : "Inativo"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(p);
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => void handleDelete(p)}
                          disabled={!p.active || deleteMutation.isPending}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PdvLocalProductModal
        open={modalOpen}
        storeId={storeId}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          setEditing(null);
          void refetch();
          toast.success("Produto salvo");
        }}
      />
    </PageShell>
  );
}
