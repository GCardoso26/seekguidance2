"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  categoryImageUrl,
  getCategoriesForGame,
} from "@/lib/tcg-product-categories";
import { MARKETPLACE_GAME_OPTIONS } from "@/lib/marketplace-games";
import type { GameId } from "@/types/card";
import { ProductCategoryIcon } from "@/components/games/ProductCategoryIcon";
import { cn } from "@/lib/utils";

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
  const [tcgId, setTcgId] = useState(initial?.tcg_id ?? "MTG");
  const [category, setCategory] = useState(initial?.category ?? "booster_box");
  const [price, setPrice] = useState(initial?.price_cents ? String(initial.price_cents / 100) : "");
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => getCategoriesForGame(tcgId as GameId),
    [tcgId],
  );

  const defaultImage = categoryImageUrl(category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const priceNum = Number(price.replace(",", "."));
      if (!name.trim() || !priceNum || priceNum <= 0) {
        throw new Error("Preencha nome e preço válidos");
      }
      const images = imageUrl.trim() ? [imageUrl.trim()] : [];
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        tcg_id: tcgId,
        category,
        price_cents: Math.round(priceNum * 100),
        stock: Number(stock) || 0,
        images,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 surface-card p-4">
      <div>
        <label className="text-sm text-muted-foreground">Nome do produto</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
          required
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Jogo (TCG)</label>
        <select
          value={tcgId}
          onChange={(e) => {
            setTcgId(e.target.value);
            const next = getCategoriesForGame(e.target.value as GameId);
            if (next[0]) setCategory(next[0].id);
          }}
          className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
        >
          {MARKETPLACE_GAME_OPTIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Categoria do produto</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-center text-xs transition",
                category === cat.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border hover:bg-muted/80",
              )}
            >
              <ProductCategoryIcon categoryId={cat.id} size={28} />
              <span className="line-clamp-2 leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-muted-foreground">Preço (R$)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
            required
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Estoque</label>
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">URL da imagem (opcional)</label>
        <p className="text-xs text-muted-foreground/80">
          Se vazio, usa imagem padrão da categoria no catálogo Judge TCG.
        </p>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted/50 p-2">
            <Image
              src={imageUrl.trim() || defaultImage}
              alt=""
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… ou deixe em branco"
            className="min-w-0 flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
