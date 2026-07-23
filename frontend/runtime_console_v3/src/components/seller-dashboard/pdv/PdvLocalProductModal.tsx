"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PDV_LOCAL_CATEGORIES,
  type PdvLocalCategory,
  type PdvLocalProduct,
} from "@/types/pdv";

export type PdvLocalProductFormValues = {
  name: string;
  category: PdvLocalCategory;
  price_cents: number;
  cost_cents: number | null;
  sku: string;
  barcode: string;
  stock: number | null;
  minimum_stock: number | null;
  active: boolean;
};

type Props = {
  open: boolean;
  storeId: string;
  initial?: PdvLocalProduct | null;
  onClose: () => void;
  onSaved: (product: PdvLocalProduct) => void;
};

function reaisToCents(value: string): number {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToReais(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

const emptyForm: PdvLocalProductFormValues = {
  name: "",
  category: "Outros",
  price_cents: 0,
  cost_cents: null,
  sku: "",
  barcode: "",
  stock: null,
  minimum_stock: null,
  active: true,
};

export function PdvLocalProductModal({ open, storeId, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<PdvLocalProductFormValues>(emptyForm);
  const [priceReais, setPriceReais] = useState("");
  const [costReais, setCostReais] = useState("");
  const [stockText, setStockText] = useState("");
  const [minStockText, setMinStockText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        category: (PDV_LOCAL_CATEGORIES.includes(initial.category as PdvLocalCategory)
          ? initial.category
          : "Outros") as PdvLocalCategory,
        price_cents: initial.price_cents,
        cost_cents: initial.cost_cents ?? null,
        sku: initial.sku ?? "",
        barcode: initial.barcode ?? "",
        stock: initial.stock,
        minimum_stock: initial.minimum_stock ?? null,
        active: initial.active,
      });
      setPriceReais(centsToReais(initial.price_cents));
      setCostReais(centsToReais(initial.cost_cents));
      setStockText(initial.stock == null ? "" : String(initial.stock));
      setMinStockText(initial.minimum_stock == null ? "" : String(initial.minimum_stock));
    } else {
      setForm(emptyForm);
      setPriceReais("");
      setCostReais("");
      setStockText("");
      setMinStockText("");
    }
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price_cents: reaisToCents(priceReais),
      cost_cents: costReais.trim() === "" ? null : reaisToCents(costReais),
      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      stock: stockText.trim() === "" ? null : Math.max(0, Math.floor(Number(stockText))),
      minimum_stock: minStockText.trim() === "" ? null : Math.max(0, Math.floor(Number(minStockText))),
      active: form.active,
    };
    try {
      const url = initial
        ? `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products/${encodeURIComponent(initial.id)}`
        : `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products`;
      const res = await fetch(url, {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        product?: PdvLocalProduct;
        detail?: string;
      };
      if (!res.ok) {
        throw new Error(data.detail || "Falha ao salvar produto local");
      }
      if (!data.product) throw new Error("Resposta inválida");
      onSaved(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="pdv-local-product-modal"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-lg"
      >
        <h3 className="text-lg font-semibold">
          {initial ? "Editar produto local" : "Adicionar Produto Local"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Visível apenas no PDV desta loja — não entra no Marketplace nem no catálogo.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 space-y-1 text-sm">
            <span>Nome</span>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              data-testid="pdv-local-name"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Categoria</span>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as PdvLocalCategory }))
              }
              data-testid="pdv-local-category"
            >
              {PDV_LOCAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span>Preço (R$)</span>
            <Input
              required
              inputMode="decimal"
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
              data-testid="pdv-local-price"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Custo (R$)</span>
            <Input
              inputMode="decimal"
              value={costReais}
              onChange={(e) => setCostReais(e.target.value)}
              data-testid="pdv-local-cost"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>SKU</span>
            <Input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              data-testid="pdv-local-sku"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Código de barras</span>
            <Input
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              data-testid="pdv-local-barcode"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Estoque (vazio = infinito)</span>
            <Input
              inputMode="numeric"
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
              placeholder="∞"
              data-testid="pdv-local-stock"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Estoque mínimo</span>
            <Input
              inputMode="numeric"
              value={minStockText}
              onChange={(e) => setMinStockText(e.target.value)}
              data-testid="pdv-local-min-stock"
            />
          </label>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              data-testid="pdv-local-active"
            />
            Ativo
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !form.name.trim()} data-testid="pdv-local-save">
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
