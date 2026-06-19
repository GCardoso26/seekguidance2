"use client";

import { useState } from "react";
import { SHOP_CATEGORIES } from "@/lib/marketplace-shop";

export type ProductFormValues = {
  name: string;
  description: string;
  tcg_id: string;
  category: string;
  price_cents: number;
  stock: number;
  images: string[];
};

type Props = {
  onSubmit: (values: ProductFormValues) => Promise<void>;
  initial?: Partial<ProductFormValues>;
  submitLabel?: string;
};

export function ProductForm({ onSubmit, initial, submitLabel = "Salvar produto" }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tcgId, setTcgId] = useState(initial?.tcg_id ?? "");
  const [category, setCategory] = useState(initial?.category ?? "booster");
  const [price, setPrice] = useState(initial?.price_cents ? String(initial.price_cents / 100) : "");
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const priceNum = Number(price.replace(",", "."));
      if (!name.trim() || !priceNum || priceNum <= 0) {
        throw new Error("Preencha nome e preço válidos");
      }
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        tcg_id: tcgId.trim() || "",
        category,
        price_cents: Math.round(priceNum * 100),
        stock: Number(stock) || 0,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <label className="text-sm text-luxury-mist">Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" required />
      </div>
      <div>
        <label className="text-sm text-luxury-mist">Descrição</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-luxury-mist">Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            {SHOP_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-luxury-mist">TCG (slug)</label>
          <input value={tcgId} onChange={(e) => setTcgId(e.target.value)} placeholder="pokemon, mtg…" className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-luxury-mist">Preço (R$)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" required />
        </div>
        <div>
          <label className="text-sm text-luxury-mist">Estoque</label>
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-sm text-luxury-mist">URL da imagem</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-luxury-gold px-4 py-2 font-semibold text-luxury-onyx disabled:opacity-50">
        {loading ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
