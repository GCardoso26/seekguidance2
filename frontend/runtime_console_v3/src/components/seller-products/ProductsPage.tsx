"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useCreateProduct, useSellerProducts } from "@/hooks/useSellerProducts";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { SELLER_PRODUCT_CATEGORIES } from "@/lib/seller-product-categories";
import { cn } from "@/lib/utils";

export function ProductsPage() {
  const [category, setCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [formCategory, setFormCategory] = useState("sleeve");

  const { data, isLoading } = useSellerProducts(category || undefined);
  const createProduct = useCreateProduct();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        name,
        category: formCategory,
        price: parseFloat(price),
        quantity: parseInt(qty, 10) || 0,
      });
      toast.success("Produto criado");
      setShowForm(false);
      setName("");
      setPrice("");
    } catch {
      toast.error("Erro ao criar produto");
    }
  }

  return (
    <>
      <SellerHeader
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            + Novo produto
          </button>
        }
      />
      <PageShell>
        <PageHeader title="Produtos" description="Sleeves, deck boxes, playmats e acessórios." />
        <div className="flex flex-wrap gap-2">
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
          <form onSubmit={handleCreate} className="surface-card p-4 space-y-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do produto"
              className="w-full surface-card rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full surface-card rounded-lg px-3 py-2 text-sm"
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Preço R$"
                className="flex-1 surface-card rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qtd"
                className="w-24 surface-card rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Salvar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3">SKU</th>
                </tr>
              </thead>
              <tbody>
                {(data?.products ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{formatShopPrice(p.price_cents)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 font-mono text-xs">{p.sku ?? "—"}</td>
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
