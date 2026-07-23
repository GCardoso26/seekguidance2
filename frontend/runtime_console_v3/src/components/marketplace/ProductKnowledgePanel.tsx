"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type KnowledgePayload = {
  product_id: string;
  title_pt?: string;
  lifecycle?: string;
  taxonomy?: Record<string, string | null | undefined>;
  collection?: {
    id: string;
    name?: string;
    slug?: string | null;
    products?: Array<{ id: string; title_pt: string; lifecycle?: string }>;
  } | null;
  official_contents?: {
    items?: Array<{
      content_type: string;
      label: string;
      quantity: number;
      unit: string;
    }>;
    decklist_url?: string | null;
    pdf_url?: string | null;
    msrp_cents?: number | null;
  } | null;
  specifications?: Array<Record<string, unknown>>;
  entity_relationships?: Array<{
    relation_type: string;
    to_entity_type: string;
    to_game_code?: string | null;
    to_entity_ref?: string | null;
  }>;
  downloads?: Array<{ package_kind: string; title?: string | null; source_url?: string | null }>;
  marketing_files?: Array<{ package_kind: string; title?: string | null; source_url?: string | null }>;
  release_information?: {
    release_date?: string | null;
    msrp_cents?: number | null;
    language?: string | null;
    expansion?: string | null;
  };
  knowledge_completeness?: number;
};

function SpecRows({ spec }: { spec: Record<string, unknown> }) {
  const skip = new Set(["id", "product_id", "extra", "created_at", "updated_at", "official", "source"]);
  const entries = Object.entries(spec).filter(
    ([k, v]) => !skip.has(k) && v != null && v !== "" && !(typeof v === "object"),
  );
  if (!entries.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k.replace(/_/g, " ")}</dt>
          <dd>{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Product Knowledge Graph panel — official contents, specs, collection, assets.
 * No AI. Marketplace PDP only.
 */
export function ProductKnowledgePanel({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["product-knowledge", productId],
    queryFn: async () => {
      const res = await fetch(
        `/api/product-catalog/products/${encodeURIComponent(productId)}/knowledge`,
      );
      if (!res.ok) return null;
      return res.json() as Promise<KnowledgePayload>;
    },
    enabled: Boolean(productId),
  });

  if (isLoading) {
    return <p className="mt-8 text-sm text-muted-foreground">Carregando conhecimento oficial…</p>;
  }
  if (!data) return null;

  const items = data.official_contents?.items ?? [];
  const specs = data.specifications ?? [];
  const downloads = data.downloads ?? [];
  const marketing = data.marketing_files ?? [];
  const entityRels = data.entity_relationships ?? [];
  const collectionProducts = data.collection?.products ?? [];

  const hasAnything =
    items.length ||
    specs.length ||
    downloads.length ||
    marketing.length ||
    entityRels.length ||
    data.collection ||
    data.release_information?.release_date;

  if (!hasAnything) return null;

  return (
    <section className="mt-10 space-y-8" data-testid="product-knowledge-panel">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Conhecimento oficial do produto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fonte: Product Catalog Knowledge Graph (APIs/manifests oficiais). Sem inferência por IA.
          {data.lifecycle ? (
            <span className="ml-2 inline-block rounded border border-border px-1.5 py-0.5 text-[10px] uppercase">
              {data.lifecycle.replace(/_/g, " ")}
            </span>
          ) : null}
        </p>
      </header>

      {items.length > 0 ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Conteúdo oficial</h3>
          <ul className="space-y-1 text-sm">
            {items.map((it) => (
              <li key={`${it.content_type}-${it.label}`} className="flex justify-between gap-4 border-b border-border/60 py-1">
                <span>{it.label}</span>
                <span className="text-muted-foreground">
                  {it.quantity} {it.unit}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {data.official_contents?.decklist_url ? (
              <a className="text-primary underline" href={data.official_contents.decklist_url} target="_blank" rel="noreferrer">
                Decklist
              </a>
            ) : null}
            {data.official_contents?.pdf_url ? (
              <a className="text-primary underline" href={data.official_contents.pdf_url} target="_blank" rel="noreferrer">
                PDF oficial
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {specs.length > 0 ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Especificações oficiais</h3>
          <div className="space-y-4">
            {specs.map((spec) => (
              <div key={String(spec.id ?? spec.spec_schema)} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {String(spec.spec_schema)}
                </p>
                <SpecRows spec={spec} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {entityRels.length > 0 ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Compatibilidade oficial</h3>
          <ul className="flex flex-wrap gap-2 text-sm">
            {entityRels.map((r) => (
              <li
                key={`${r.relation_type}-${r.to_game_code ?? r.to_entity_ref}`}
                className="rounded border border-border px-2 py-1"
              >
                <span className="text-muted-foreground">{r.relation_type.replace(/_/g, " ")}:</span>{" "}
                {r.to_game_code ?? r.to_entity_ref ?? r.to_entity_type}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.collection ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Coleção</h3>
          <p className="mb-2 text-sm">
            {data.collection.slug ? (
              <Link
                href={`/portal/catalog/collections/${encodeURIComponent(data.collection.slug)}`}
                className="text-primary underline"
              >
                Ver todos os produtos de {data.collection.name}
              </Link>
            ) : (
              data.collection.name
            )}
          </p>
          {collectionProducts.length > 0 ? (
            <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              {collectionProducts.slice(0, 8).map((p) => (
                <li key={p.id} className="truncate text-muted-foreground">
                  {p.title_pt}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {data.release_information?.release_date || data.release_information?.msrp_cents ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Lançamento</h3>
          <ul className="text-sm text-muted-foreground">
            {data.release_information.release_date ? (
              <li>Data: {String(data.release_information.release_date).slice(0, 10)}</li>
            ) : null}
            {data.release_information.expansion ? (
              <li>Expansão: {data.release_information.expansion}</li>
            ) : null}
            {data.release_information.language ? (
              <li>Idioma: {data.release_information.language}</li>
            ) : null}
            {data.release_information.msrp_cents != null ? (
              <li>MSRP: {(Number(data.release_information.msrp_cents) / 100).toFixed(2)}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {downloads.length > 0 ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Downloads oficiais</h3>
          <ul className="space-y-1 text-sm">
            {downloads.map((d, i) => (
              <li key={`${d.package_kind}-${i}`}>
                {d.source_url ? (
                  <a href={d.source_url} className="text-primary underline" target="_blank" rel="noreferrer">
                    {d.title ?? d.package_kind}
                  </a>
                ) : (
                  <span>{d.title ?? d.package_kind}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {marketing.length > 0 ? (
        <div>
          <h3 className="mb-2 text-base font-medium">Marketing oficial</h3>
          <ul className="space-y-1 text-sm">
            {marketing.map((d, i) => (
              <li key={`${d.package_kind}-m-${i}`}>
                {d.source_url ? (
                  <a href={d.source_url} className="text-primary underline" target="_blank" rel="noreferrer">
                    {d.title ?? d.package_kind}
                  </a>
                ) : (
                  <span>{d.title ?? d.package_kind}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
