"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CardImage } from "@/components/ui/CardImage";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useMasterProductSearch, usePublishMasterListing } from "@/hooks/useMasterProductCatalog";
import { mediaTypeFromCategory } from "@/lib/assets";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { id: "NEW", label: "Novo" },
  { id: "LIKE_NEW", label: "Como novo" },
  { id: "GOOD", label: "Bom" },
  { id: "PLAYED", label: "Usado" },
  { id: "HEAVILY_PLAYED", label: "Muito usado" },
  { id: "DAMAGED", label: "Danificado" },
] as const;

export function MasterCatalogPublishPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]["id"]>("NEW");

  const { data, isLoading } = useMasterProductSearch({ q, category: category || undefined });
  const publish = usePublishMasterListing();

  const selected = useMemo(
    () => data?.items.find((i) => i.variant_id === selectedVariantId),
    [data?.items, selectedVariantId],
  );

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariantId) {
      toast.error("Selecione uma variante");
      return;
    }
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    if (!Number.isFinite(priceNum) || priceNum < 0.01) {
      toast.error("Preço inválido");
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      toast.error("Estoque inválido");
      return;
    }
    try {
      await publish.mutateAsync({
        variant_id: selectedVariantId,
        price_cents: Math.round(priceNum * 100),
        stock: stockNum,
        condition,
      });
      toast.success("Publicado no catálogo da loja");
    } catch {
      toast.error("Erro ao publicar");
    }
  }

  return (
    <>
      <SellerHeader
        action={
          <Link
            href="/vendedor/painel/catalogo/produtos"
            className="text-sm text-primary hover:underline"
          >
            Voltar aos produtos
          </Link>
        }
      />
      <PageShell>
        <PageHeader
          title="Catálogo Mestre"
          description="Busque o produto oficial, escolha a variante e informe preço, estoque e condição."
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou SKU…"
            className="min-w-[16rem] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            data-testid="master-catalog-search"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
            aria-label="Categoria"
          >
            <option value="">Todas categorias</option>
            <option value="SEALED_PRODUCT">Selados</option>
            <option value="SLEEVES">Sleeves</option>
            <option value="DECK_BOX">Deck Box</option>
            <option value="BINDER">Pastas</option>
            <option value="PLAYMAT">Playmat</option>
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border p-4">
            <h2 className="mb-3 text-sm font-semibold">Resultados</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                {(data?.items ?? []).map((item) => (
                  <li key={item.variant_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedVariantId(item.variant_id)}
                      className={cn(
                        "flex w-full gap-3 rounded-lg border p-2 text-left text-sm",
                        selectedVariantId === item.variant_id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      {item.image_url ? (
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted/40">
                          <CardImage
                            src={item.image_url}
                            alt={item.title_pt}
                            fallbackLabel={item.title_pt.slice(0, 8)}
                            mediaType={mediaTypeFromCategory(item.category)}
                            fill
                            listQuality
                            className="object-contain"
                            sizes="48px"
                          />
                        </span>
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs">
                          —
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.title_pt}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.variant_name} · {item.category}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={handlePublish} className="space-y-4 rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold">Publicar oferta</h2>
            {selected ? (
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p className="font-medium">{selected.title_pt}</p>
                <p className="text-muted-foreground">{selected.variant_name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Nome, imagem, marca e categoria vêm do catálogo central — não editáveis.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione um produto à esquerda.</p>
            )}
            <label className="block text-sm">
              Preço (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                data-testid="master-catalog-price"
              />
            </label>
            <label className="block text-sm">
              Estoque
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                data-testid="master-catalog-stock"
              />
            </label>
            <label className="block text-sm">
              Condição
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as typeof condition)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={!selectedVariantId || publish.isPending}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              data-testid="master-catalog-publish"
            >
              Publicar
            </button>
          </form>
        </div>
      </PageShell>
    </>
  );
}
