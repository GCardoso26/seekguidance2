"use client";

import { useMemo, useState } from "react";
import { diffSnapshots } from "@/lib/deck-stats";
import { useDeckRevisions } from "@/hooks/useDeckRevisions";
import type { Deck } from "@/types/deck";
import { snapshotDeck } from "@/lib/deck-stats";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";

type Props = { deck: Deck };

export function DeckHistoryPanel({ deck }: Props) {
  const { revisions, record, refresh } = useDeckRevisions(deck.id);
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  const revA = revisions.find((r) => r.id === a);
  const revB = revisions.find((r) => r.id === b);
  const diff = useMemo(() => {
    if (!revA || !revB) return null;
    return diffSnapshots(revA.snapshot, revB.snapshot);
  }, [revA, revB]);

  return (
    <section className="space-y-6" data-testid="deck-history-panel">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3">Histórico (append-only)</h2>
          <p className="text-small text-muted-foreground">
            Revisões no workspace local do jogador — inspirado em Git. Sem alterar versões
            anteriores.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            record(deck, "Snapshot manual");
            refresh();
          }}
        >
          Criar revisão agora
        </Button>
      </div>

      {revisions.length === 0 ? (
        <p className="text-small text-muted-foreground">
          Nenhuma revisão ainda. Salve o deck no editor ou crie um snapshot.
        </p>
      ) : (
        <ol className="space-y-2">
          {[...revisions].reverse().map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border/60 bg-card/30 px-3 py-2 text-small"
            >
              <p className="font-medium text-foreground">
                v{r.version} · {r.description}
              </p>
              <p className="text-caption text-muted-foreground">
                {new Date(r.createdAt).toLocaleString("pt-BR")}
                {r.author ? ` · ${r.author}` : ""}
                {" · "}
                {r.changeCount} alterações · {r.snapshot.totalCards} cartas ·{" "}
                {formatCurrency(r.snapshot.estimatedPrice)}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-xl border border-border/70 bg-card/40 p-4">
        <h3 className="text-h3">Comparar versões</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-small">
            De{" "}
            <select
              className="ml-1 rounded border border-input bg-background px-2 py-1"
              value={a}
              onChange={(e) => setA(e.target.value)}
            >
              <option value="">—</option>
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.version}
                </option>
              ))}
            </select>
          </label>
          <label className="text-small">
            Para{" "}
            <select
              className="ml-1 rounded border border-input bg-background px-2 py-1"
              value={b}
              onChange={(e) => setB(e.target.value)}
            >
              <option value="">—</option>
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>
                  v{r.version}
                </option>
              ))}
              <option value="__current">Atual</option>
            </select>
          </label>
        </div>

        {b === "__current" && revA && (
          <DiffView
            diff={diffSnapshots(revA.snapshot, snapshotDeck(deck))}
          />
        )}
        {diff && b !== "__current" && <DiffView diff={diff} />}
      </div>
    </section>
  );
}

function DiffView({
  diff,
}: {
  diff: ReturnType<typeof diffSnapshots>;
}) {
  return (
    <div className="mt-4 space-y-3 text-small" data-testid="deck-revision-diff">
      <p className="text-muted-foreground">
        Δ cartas {diff.cardCountDelta >= 0 ? "+" : ""}
        {diff.cardCountDelta} · Δ preço {formatCurrency(diff.priceDelta)}
      </p>
      {diff.added.length > 0 && (
        <div>
          <p className="font-medium text-success">Adicionadas</p>
          <ul>
            {diff.added.map((c) => (
              <li key={`${c.zone}-${c.card_id}`}>
                +{c.quantity} {c.name} ({c.zone})
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.removed.length > 0 && (
        <div>
          <p className="font-medium text-danger">Removidas</p>
          <ul>
            {diff.removed.map((c) => (
              <li key={`${c.zone}-${c.card_id}`}>
                −{c.quantity} {c.name} ({c.zone})
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.changed.length > 0 && (
        <div>
          <p className="font-medium">Quantidade</p>
          <ul>
            {diff.changed.map((c) => (
              <li key={`${c.zone}-${c.card_id}`}>
                {c.name}: {c.from} → {c.to} ({c.zone})
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.added.length + diff.removed.length + diff.changed.length === 0 && (
        <p className="text-muted-foreground">Sem diferenças de lista.</p>
      )}
    </div>
  );
}
