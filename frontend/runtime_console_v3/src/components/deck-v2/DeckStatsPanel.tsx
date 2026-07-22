"use client";

import { computeDeckCatalogStats } from "@/lib/deck-stats";
import { formatCurrency } from "@/lib/format-currency";
import type { Deck } from "@/types/deck";

type Props = { deck: Deck };

export function DeckStatsPanel({ deck }: Props) {
  const s = computeDeckCatalogStats(deck);
  const maxCurve = Math.max(...s.manaCurve.map((b) => b.count), 1);

  return (
    <section className="space-y-6" data-testid="deck-stats-panel">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          ["Total", s.totalCards],
          ["Main", s.mainCards],
          ["Side", s.sideboardCards],
          ["Únicas", s.uniqueCards],
          ["Terrenos", s.lands],
          ["Criaturas", s.creatures],
          ["Mágicas", s.spells],
          ["Premium", s.premium],
          ["Foil", s.foil],
          ["Banidas*", s.bannedHints],
          ["Restritas*", s.restrictedHints],
          ["Não legais*", s.illegalHints],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-border/70 bg-card/40 p-3">
            <p className="text-caption text-muted-foreground">{label}</p>
            <p className="text-h3 font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 p-4">
        <h3 className="text-h3 text-foreground">Curva de mana / custo</h3>
        <p className="mt-1 text-caption text-muted-foreground">
          Derivada dos campos Catalog (CMC / custo) embutidos nas cartas.
        </p>
        <div className="mt-4 flex h-36 items-end gap-1.5" role="img" aria-label="Curva de mana">
          {s.manaCurve.map((b) => (
            <div key={b.cmc} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${(b.count / maxCurve) * 100}%`, minHeight: b.count ? 4 : 0 }}
                title={`${b.count}`}
              />
              <span className="text-caption text-muted-foreground">
                {b.cmc === 7 ? "7+" : b.cmc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Dist title="Por tipo" data={s.byType} />
        <Dist title="Por cor" data={s.byColor} />
        <Dist title="Por facção" data={s.byFaction} empty="Sem facções no Catalog deste jogo." />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 p-4">
        <h3 className="text-h3">Preço (Catalog)</h3>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <dt className="text-caption text-muted-foreground">Estimado</dt>
            <dd className="font-semibold">{formatCurrency(s.estimatedPrice)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Mínimo un.</dt>
            <dd className="font-semibold">
              {s.minPrice != null ? formatCurrency(s.minPrice) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Médio un.</dt>
            <dd className="font-semibold">
              {s.avgPrice != null ? formatCurrency(s.avgPrice) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-caption text-muted-foreground">
          * Legalidade usa `legalities` do Catalog quando o formato está mapeado.
        </p>
      </div>
    </section>
  );
}

function Dist({
  title,
  data,
  empty,
}: {
  title: string;
  data: Record<string, number>;
  empty?: string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-4">
      <h3 className="text-h3">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-caption text-muted-foreground">{empty ?? "—"}</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {entries.slice(0, 8).map(([k, v]) => (
            <li key={k} className="flex justify-between text-small">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
