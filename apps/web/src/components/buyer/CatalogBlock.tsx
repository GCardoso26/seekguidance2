import type { CardDetails } from "@/src/types/api";
import { setLabel } from "@/src/lib/format";

/**
 * Official catalog block — never render seller / price / offer data here.
 */
export function CatalogBlock({ card }: { card: CardDetails }) {
  return (
    <section
      aria-labelledby="catalog-heading"
      data-testid="catalog-block"
      className="rounded-lg border border-zinc-300 bg-white p-6"
    >
      <p
        id="catalog-heading"
        className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500"
      >
        Catalog
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-48 w-36 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-100 text-xs text-zinc-400">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs; Image CDN deferred to hardening
            <img
              src={card.imageUrl}
              alt={card.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span>Sem imagem</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-semibold text-zinc-900">{card.name}</h1>
          <dl className="grid gap-2 text-sm text-zinc-700">
            <div>
              <dt className="font-medium text-zinc-900">Set</dt>
              <dd>{setLabel(card.setCode, card.setName)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Rarity</dt>
              <dd>{card.rarity ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Oracle</dt>
              <dd className="whitespace-pre-wrap text-zinc-600">
                {card.oracleText?.trim() ? card.oracleText : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
