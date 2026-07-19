"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  useCreateProduct,
  useDeleteProduct,
  useSellerProducts,
  useUpdateProduct,
  type SellerProduct,
} from "@/hooks/useSellerProducts";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { SELLER_PRODUCT_CATEGORIES } from "@/lib/seller-product-categories";
import { cn } from "@/lib/utils";

export function ProductsPage() {
  const [category, setCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SellerProduct | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [formCategory, setFormCategory] = useState("sleeve");

  const { data, isLoading } = useSellerProducts(category || undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  function openCreate() {
    setEditing(null);
    setName("");
    setPrice("");
    setQty("1");
    setFormCategory("sleeve");
    setShowForm(true);
  }

  function openEdit(p: SellerProduct) {
    setEditing(p);
    setName(p.name);
    setPrice((p.price_cents / 100).toFixed(2));
    setQty(String(p.stock));
    setFormCategory(p.category || "sleeve");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Nome obrigatório");
      return;
    }
    if (trimmed.length > 255) {
      toast.error("Nome muito longo (máx. 255)");
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0.01) {
      toast.error("Preço inválido");
      return;
    }
    const qtyNum = parseInt(qty, 10);
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      toast.error("Estoque inválido");
      return;
    }
    try {
      if (editing) {
        await updateProduct.mutateAsync({
          id: editing.id,
          name: trimmed,
          category: formCategory,
          price: priceNum,
          quantity: qtyNum,
        });
        toast.success("Produto atualizado");
      } else {
        await createProduct.mutateAsync({
          name: trimmed,
          category: formCategory,
          price: priceNum,
          quantity: qtyNum,
        });
        toast.success("Cadastrado com sucesso");
      }
      setShowForm(false);
      setEditing(null);
      setName("");
      setPrice("");
    } catch {
      toast.error(editing ? "Erro ao cadastrar" : "Erro ao cadastrar");
    }
  }

  async function handleDelete(p: SellerProduct) {
    if (!window.confirm(`Excluir "${p.name}"?`)) return;
    try {
      await deleteProduct.mutateAsync(p.id);
      toast.success("Produto excluído");
    } catch {
      toast.error("Erro ao excluir produto");
    }
  }

  return (
    <>
      <SellerHeader
        action={
          <button
            type="button"
            onClick={openCreate}
            data-testid="btn-add-product"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            + Novo produto
          </button>
        }
      />
      <PageShell>
        <PageHeader title="Produtos" description="Sleeves, deck boxes, playmats e acessórios." />
        <div className="flex flex-wrap gap-2" data-testid="product-categories">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              !category ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
            )}
          >
            Todos
          </button>
          {SELLER_PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                category === cat.id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="surface-card space-y-3 p-4"
            data-testid="product-form"
          >
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
              data-testid="product-name-input"
              className="w-full rounded-lg surface-card px-3 py-2 text-sm"
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              data-testid="product-category-select"
              className="w-full rounded-lg surface-card px-3 py-2 text-sm"
            >
              {SELLER_PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Preço R$"
                data-testid="product-price-input"
                className="flex-1 rounded-lg surface-card px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qtd"
                data-testid="product-stock-input"
                className="w-24 rounded-lg surface-card px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                data-testid="save-product"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm" data-testid="products-table">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(data?.products ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border" data-testid={`product-row-${p.id}`}>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{formatShopPrice(p.price_cents)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 font-mono text-xs">{p.sku ?? "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          data-testid={`product-edit-${p.id}`}
                          onClick={() => openEdit(p)}
                          className="text-xs text-primary hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          data-testid={`product-delete-${p.id}`}
                          onClick={() => void handleDelete(p)}
                          className="text-xs text-danger hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </>
  );
}
