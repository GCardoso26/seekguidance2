"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CardSearchInput } from "@/components/seller-catalog/CardSearchInput";
import { GameSelectorTabs } from "@/components/seller-catalog/GameSelectorTabs";
import { useCatalogCards, type CatalogCard } from "@/hooks/useCatalogCards";
import {
  addListingFormSchema,
  addListingToApiPayload,
  type AddListingFormValues,
} from "@/lib/seller-catalog-listing-form";
import { formatCurrency } from "@/lib/format-currency";
import { getGameConfigOrFallback } from "@/lib/game-config";
import { CATALOG_GAME_SLUGS, DEFAULT_CATALOG_GAME_SLUG, type CatalogGameSlug } from "@/lib/seller-product-categories";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

function gameSlugFromCard(game?: string | null): CatalogGameSlug {
  if (!game) return DEFAULT_CATALOG_GAME_SLUG;
  const token = GAME_TOKENS[game.toUpperCase() as GameId];
  const slug = (token?.slug ?? game.toLowerCase()) as string;
  const match = CATALOG_GAME_SLUGS.find((g) => g.slug === slug);
  return match?.slug ?? DEFAULT_CATALOG_GAME_SLUG;
}

export function ListingPublishWizard() {
  const searchParams = useSearchParams();
  const prefillCardId = searchParams.get("cardId");

  const [game, setGame] = useState(DEFAULT_CATALOG_GAME_SLUG);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<CatalogCard | null>(null);
  const [prefillDone, setPrefillDone] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(prefillCardId));

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useCatalogCards(game, debounced);
  const gameCfg = getGameConfigOrFallback(game);
  const CONDITIONS = gameCfg.conditions.map((c) => c.value) as Array<"NM" | "LP" | "MP" | "HP" | "DM">;
  const LANGUAGES = gameCfg.languages.map((l) => {
    const raw = l.value === "ja" ? "jp" : l.value;
    return {
      value: raw as "pt" | "en" | "jp" | "de" | "es" | "fr" | "it",
      label: l.label,
    };
  });

  useEffect(() => {
    if (!prefillCardId || prefillDone) return;
    let cancelled = false;
    (async () => {
      setPrefillLoading(true);
      try {
        const res = await fetch(`/api/catalog/cards/${encodeURIComponent(prefillCardId)}`);
        if (!res.ok) throw new Error("not_found");
        const detail = (await res.json()) as {
          card: {
            id: string;
            name: string;
            game: string;
            set?: { name?: string; code?: string };
            rarity?: string;
            number?: string;
            language?: string;
            imageUris?: { normal?: string; small?: string };
            lowestPrice?: number;
          };
        };
        if (cancelled) return;
        const c = detail.card;
        setGame(gameSlugFromCard(c.game));
        setSelected({
          id: c.id,
          name: c.name,
          set_name: c.set?.name,
          set_code: c.set?.code,
          rarity: c.rarity,
          image_url: c.imageUris?.normal ?? c.imageUris?.small ?? null,
          imageUris: c.imageUris ?? null,
          lowest_price_cents: c.lowestPrice != null ? Math.round(c.lowestPrice * 100) : undefined,
          language: c.language,
          number: c.number,
          game: c.game,
        });
        setSearch(c.name);
        setPrefillDone(true);
      } catch {
        toast.error("Não foi possível pré-carregar a carta.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefillCardId, prefillDone]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddListingFormValues>({
    resolver: zodResolver(addListingFormSchema),
    defaultValues: {
      price: 0,
      quantity: 1,
      language: "pt",
      foil: false,
      condition: "NM",
      description: "",
      sku: "",
    },
  });

  const foil = watch("foil");
  const condition = watch("condition");
  const price = watch("price");

  useEffect(() => {
    if (selected) {
      const lang = selected.language;
      const allowed = ["pt", "en", "jp", "de", "es", "fr", "it"] as const;
      const language = allowed.includes(lang as (typeof allowed)[number])
        ? (lang as (typeof allowed)[number])
        : "pt";
      reset({
        price: selected.lowest_price_cents ? selected.lowest_price_cents / 100 : 0,
        quantity: 1,
        language,
        foil: false,
        condition: "NM",
        description: "",
        sku: selected.number ? `${selected.set_code ?? ""}-${selected.number}` : "",
      });
    }
  }, [selected, reset]);

  async function onSubmit(values: AddListingFormValues) {
    if (!selected) return;
    const res = await fetch("/api/seller/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addListingToApiPayload(selected.id, values)),
    });
    if (!res.ok) {
      toast.error("Erro ao cadastrar");
      return;
    }
    toast.success("Cadastrado com sucesso");
    setSelected(null);
    setSearch("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="listing-publish-wizard">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Escolha a carta</h2>
        {prefillLoading && (
          <p className="text-sm text-muted-foreground" data-testid="listing-prefill-loading">
            Pré-preenchendo carta selecionada…
          </p>
        )}
        {selected && prefillDone && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
            Carta pré-selecionada: <strong>{selected.name}</strong>
            {selected.set_name ? ` · ${selected.set_name}` : ""}
            {selected.number ? ` · #${selected.number}` : ""}
          </p>
        )}
        <GameSelectorTabs activeSlug={game} onChange={setGame} />
        <CardSearchInput
          value={search}
          onChange={setSearch}
          placeholder={gameCfg.sellerWizardCopy.searchPlaceholder}
        />
        <p className="text-xs text-muted-foreground">{gameCfg.sellerWizardCopy.emptyInventoryHint}</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Buscando…</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {(data?.cards ?? []).slice(0, 20).map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => setSelected(card)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted/80 ${
                    selected?.id === card.id ? "bg-primary/15 ring-1 ring-primary/40" : ""
                  }`}
                >
                  {card.image_url && (
                    <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded">
                      <Image src={card.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <span className="truncate">{card.name}</span>
                  {card.lowest_price_cents != null && (
                    <span className="ml-auto text-xs text-primary">
                      {formatCurrency(card.lowest_price_cents / 100)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">2. Detalhes e publicar</h2>
        {!selected ? (
          <p className="text-sm text-muted-foreground">Selecione uma carta à esquerda para continuar.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex gap-3">
              {selected.image_url && (
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image src={selected.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div>
                <p className="font-semibold">{selected.name}</p>
                {selected.lowest_price_cents != null && (
                  <p className="text-sm text-muted-foreground">
                    Preço sugerido: {formatCurrency(selected.lowest_price_cents / 100)}
                  </p>
                )}
              </div>
            </div>

            <label className="block text-sm">
              Preço (R$)
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <span className="text-xs text-danger">{errors.price.message}</span>}
            </label>

            <label className="block text-sm">
              Quantidade
              <input
                type="number"
                min="1"
                className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                {...register("quantity", { valueAsNumber: true })}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <p className="w-full text-xs text-muted-foreground">{gameCfg.sellerWizardCopy.conditionHint}</p>
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("condition", c)}
                  className={`rounded-lg px-3 py-1 text-xs ${
                    condition === c ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <p className="w-full text-xs text-muted-foreground">{gameCfg.sellerWizardCopy.finishHint}</p>
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setValue("language", l.value)}
                  className={`rounded-lg px-3 py-1 text-xs ${
                    watch("language") === l.value ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setValue("foil", !foil)}
                className={`rounded-lg px-3 py-1 text-xs ${foil ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                Foil
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !price}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? "Publicando…" : "Publicar e cadastrar outra"}
            </button>
            <Link
              href="/vendedor/painel/listagens"
              className="block text-center text-sm text-muted-foreground underline"
            >
              Ver meus anúncios
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
