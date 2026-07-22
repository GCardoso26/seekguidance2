"use client";

import Link from "next/link";
import { computeDeckCatalogStats } from "@/lib/deck-stats";
import { formatCurrency } from "@/lib/format-currency";
import { useValidateDeck } from "@/hooks/useDeck";
import { DECK_AI_SLOTS } from "@/lib/deck-ai-slots";
import type { Deck } from "@/types/deck";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type Props = { deck: Deck };

export function DeckAnalysisPanel({ deck }: Props) {
  const validate = useValidateDeck(deck.id);
  const stats = computeDeckCatalogStats(deck);

  useEffect(() => {
    validate.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per deck
  }, [deck.id]);

  const validation = validate.data;
  const repeats = [...(deck.main_deck ?? [])]
    .filter((e) => e.quantity > 1)
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <section className="space-y-6" data-testid="deck-analysis-panel">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Consistência"
          value={
            validation
              ? validation.isValid
                ? "OK"
                : "Atenção"
              : validate.isPending
                ? "…"
                : "—"
          }
        />
        <Metric label="Curva (pico)" value={String(Math.max(...stats.manaCurve.map((b) => b.cmc)))} />
        <Metric
          label="Balanceamento"
          value={`${stats.creatures}C / ${stats.spells}S / ${stats.lands}L`}
        />
        <Metric
          label="Preço estimado"
          value={formatCurrency(stats.estimatedPrice)}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 p-4">
        <h3 className="text-h3">Validação (Deck API)</h3>
        {validate.isPending && (
          <p className="mt-2 text-small text-muted-foreground">Validando…</p>
        )}
        {validation && (
          <ul className="mt-3 space-y-1 text-small">
            {(validation.errors ?? []).map((e) => (
              <li key={e} className="text-danger">
                {e}
              </li>
            ))}
            {(validation.warnings ?? []).map((w) => (
              <li key={w} className="text-muted-foreground">
                {w}
              </li>
            ))}
            {validation.isValid && (validation.errors ?? []).length === 0 && (
              <li className="text-success">Deck dentro das regras do formato.</li>
            )}
          </ul>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => validate.mutate()}
          disabled={validate.isPending}
        >
          Revalidar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/40 p-4">
          <h3 className="text-h3">Cartas repetidas</h3>
          {repeats.length === 0 ? (
            <p className="mt-2 text-small text-muted-foreground">Nenhuma repetição no main.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {repeats.slice(0, 12).map((e) => (
                <li key={e.id} className="flex justify-between text-small">
                  <span>{e.card.name}</span>
                  <span className="tabular-nums">{e.quantity}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border/70 bg-card/40 p-4">
          <h3 className="text-h3">Legalidade (Catalog)</h3>
          <ul className="mt-2 space-y-1 text-small text-muted-foreground">
            <li>Banidas (hint): {stats.bannedHints}</li>
            <li>Restritas (hint): {stats.restrictedHints}</li>
            <li>Não legais (hint): {stats.illegalHints}</li>
          </ul>
          <p className="mt-2 text-caption text-muted-foreground">
            Liquidez / Meta Share / torneios: placeholder até Analytics público estável.
          </p>
          <p className="mt-1 text-small font-medium text-foreground">Meta % — · Popularidade —</p>
        </div>
      </div>

      <aside
        className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4"
        data-testid="deck-ai-slots"
      >
        <h3 className="text-h3">Advisors de IA (estrutura)</h3>
        <p className="mt-1 text-caption text-muted-foreground">
          Extensões futuras — apenas APIs públicas. Não implementado.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {DECK_AI_SLOTS.map((slot) => (
            <li
              key={slot.id}
              data-ai-slot={slot.id}
              className="rounded-md border border-border/60 px-2 py-1 text-caption text-muted-foreground"
              title={slot.description}
            >
              {slot.label}
            </li>
          ))}
        </ul>
      </aside>

      <Link href={`/decks/${deck.id}?tab=marketplace`} className="text-small text-primary hover:underline">
        Ver cartas faltantes no Marketplace →
      </Link>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
