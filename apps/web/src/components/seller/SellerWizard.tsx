"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiClients } from "@/src/api";
import { publishListingWithInventory } from "@/src/api/marketplace.client";
import { ApiError } from "@/src/api/client";
import { Analytics } from "@/src/analytics/events";
import { measureTimeToFirstListingMs } from "@/src/auth/seller-funnel";
import { resolveVariantId } from "@/src/lib/resolve-variant";
import { setLabel } from "@/src/lib/format";
import {
  commercialSchema,
  priceReaisToCents,
  type CommercialFormValues,
} from "@/src/schemas/seller";
import type { CardSummary, ListingResponse } from "@/src/types/api";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Form,
  Input,
  Loading,
} from "@/src/components/ui";

type Step = "search" | "commercial" | "success";

export function SellerWizard() {
  const { publicApi, marketplaceApi } = getApiClients();
  const [step, setStep] = useState<Step>("search");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CardSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardSummary | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<ListingResponse | null>(null);
  const [wasFirstListing, setWasFirstListing] = useState(false);
  const [intentSent, setIntentSent] = useState(false);
  const searchedOnce = useRef(false);

  const form = useForm<CommercialFormValues>({
    resolver: zodResolver(commercialSchema),
    defaultValues: {
      quantity: 1,
      condition: "NM",
      language: "en",
      foil: false,
      priceReais: 20,
    },
  });

  const runSearch = useCallback(async () => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    setSearchError(null);
    if (!searchedOnce.current) {
      searchedOnce.current = true;
      Analytics.track("seller_first_search", { q: trimmed });
    }
    try {
      const result = await publicApi.search({ q: trimmed, limit: 12 });
      setHits(result.hits.map((h) => h.card));
    } catch (err) {
      setHits([]);
      setSearchError(err instanceof ApiError ? err.code : "search_failed");
    } finally {
      setSearching(false);
    }
  }, [q, publicApi]);

  function selectCard(card: CardSummary) {
    setSelected(card);
    Analytics.track("seller_card_selected", {
      cardId: card.id,
      name: card.name,
    });
    setStep("commercial");
    setPublishError(null);
  }

  const onPublish = form.handleSubmit(async (values) => {
    if (!selected) return;
    setPublishing(true);
    setPublishError(null);
    Analytics.track("seller_listing_publish_started", { cardId: selected.id });

    try {
      const { catalogVariantId, finish } = await resolveVariantId(
        publicApi,
        selected.id,
        values.foil,
      );
      const listing = await publishListingWithInventory(marketplaceApi, {
        catalogCardId: selected.id,
        catalogVariantId,
        condition: values.condition,
        language: values.language,
        finish,
        quantity: values.quantity,
        priceCents: priceReaisToCents(values.priceReais),
        status: "active",
      });
      setPublished(listing);
      Analytics.track("seller_listing_published", {
        listingId: listing.id,
        cardId: selected.id,
      });
      const ms = measureTimeToFirstListingMs();
      if (ms != null) {
        Analytics.track("seller_time_to_first_listing_ms", { ms });
        setWasFirstListing(true);
        setIntentSent(false);
      } else {
        setWasFirstListing(false);
      }
      setStep("success");
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.code : "publish_failed");
    } finally {
      setPublishing(false);
    }
  });

  if (step === "success" && published && selected) {
    const listing = published;
    const card = selected;

    function trackIntent(intent: "will_add_more" | "maybe" | "no") {
      if (intentSent) return;
      Analytics.track("seller_intent_after_first_listing", {
        intent,
        listingId: listing.id,
        cardId: card.id,
      });
      setIntentSent(true);
    }

    return (
      <div className="space-y-4">
        <p className="text-lg font-medium text-emerald-800">
          ✅ {card.name} publicada
        </p>
        <p className="text-sm text-zinc-600">
          Anúncio ativo · {listing.condition} · {listing.language.toUpperCase()} ·{" "}
          {(listing.priceCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>

        {wasFirstListing && !intentSent ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-900">
              Você pretende cadastrar mais cartas depois desta primeira sessão?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => trackIntent("will_add_more")}>
                Sim, vou cadastrar mais
              </Button>
              <Button type="button" variant="ghost" onClick={() => trackIntent("maybe")}>
                Talvez
              </Button>
              <Button type="button" variant="ghost" onClick={() => trackIntent("no")}>
                Não
              </Button>
            </div>
          </div>
        ) : null}

        {wasFirstListing && intentSent ? (
          <p className="text-xs text-zinc-500">Obrigado — isso nos ajuda a entender o beta.</p>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/cards/${encodeURIComponent(card.id)}`}
            className="font-medium text-emerald-800 underline"
          >
            Ver anúncio
          </Link>
          <Link href="/seller/listings" className="text-zinc-700 underline">
            Meus anúncios
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("search");
              setSelected(null);
              setPublished(null);
              setHits([]);
              setQ("");
              setWasFirstListing(false);
            }}
          >
            Publicar outra
          </Button>
        </div>
      </div>
    );
  }

  if (step === "commercial" && selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-sm text-emerald-800 underline"
          onClick={() => setStep("search")}
        >
          ← Trocar carta
        </button>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{selected.name}</h2>
          <p className="text-sm text-zinc-600">
            {setLabel(selected.setCode, selected.setName)}
          </p>
        </div>
        <Form onSubmit={onPublish}>
          <Field label="Quantidade" error={form.formState.errors.quantity?.message}>
            <Input
              type="number"
              min={1}
              step={1}
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Condição" error={form.formState.errors.condition?.message}>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              {...form.register("condition")}
            >
              <option value="NM">NM</option>
              <option value="LP">LP</option>
              <option value="MP">MP</option>
              <option value="HP">HP</option>
              <option value="DM">DM</option>
            </select>
          </Field>
          <Field label="Idioma" error={form.formState.errors.language?.message}>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              {...form.register("language")}
            >
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="es">ES</option>
              <option value="jp">JP</option>
            </select>
          </Field>
          <Field label="Foil">
            <label className="flex items-center gap-2 text-sm text-zinc-800">
              <input type="checkbox" {...form.register("foil")} />
              Sim
            </label>
          </Field>
          <Field label="Preço (R$)" error={form.formState.errors.priceReais?.message}>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              {...form.register("priceReais", { valueAsNumber: true })}
            />
          </Field>
          {publishError ? (
            <ErrorState title="Não foi possível publicar" description={publishError} />
          ) : null}
          <Button type="submit" disabled={publishing} className="w-full uppercase tracking-wide">
            {publishing ? "Publicando…" : "Publicar anúncio"}
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">O que você quer vender?</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Lightning Bolt"
          aria-label="Buscar carta para vender"
          autoFocus
        />
        <Button type="submit" disabled={searching}>
          Buscar
        </Button>
      </form>

      {searching ? <Loading label="Buscando cartas…" /> : null}
      {searchError ? (
        <ErrorState title="Busca falhou" description={searchError} />
      ) : null}
      {!searching && !searchError && q.trim() && hits.length === 0 ? (
        <EmptyState title="Nenhuma carta encontrada" description="Tente outro nome." />
      ) : null}

      <ul className="divide-y divide-zinc-200">
        {hits.map((card) => (
          <li key={card.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-zinc-900">{card.name}</p>
              <p className="text-sm text-zinc-600">
                {setLabel(card.setCode, card.setName)}
                {card.rarity ? ` · ${card.rarity}` : ""}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => selectCard(card)}>
              Selecionar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
