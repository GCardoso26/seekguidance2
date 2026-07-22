"use client";

import Link from "next/link";
import { gameMetaFromCode, type CollectionSetBreakdown } from "@/lib/collection-v2";
import { formatCurrency } from "@/lib/format-currency";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

type Props = {
  sets: CollectionSetBreakdown[];
  gameSlug?: string;
  currency?: string;
};

export function CollectionSetGrid({ sets, gameSlug, currency = "BRL" }: Props) {
  const filtered = gameSlug
    ? sets.filter((s) => {
        const meta = gameMetaFromCode(s.gameCode);
        return meta.slug === gameSlug;
      })
    : sets;

  if (filtered.length === 0) {
    return <p className="text-small text-muted-foreground">Nenhuma expansão nesta visão.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="collection-set-grid">
      {filtered.map((s) => {
        const meta = gameMetaFromCode(s.gameCode);
        const slug = gameSlug || meta.slug;
        return (
          <li key={`${s.gameCode}-${s.setCode}`}>
            <Link
              href={`/colecao/expansao/${slug}/${encodeURIComponent(s.setCode)}`}
              className="block rounded-xl border border-border/70 bg-card/40 p-4 transition hover:border-primary/40"
            >
              <p className="font-semibold text-foreground">{s.setName}</p>
              <p className="mt-1 text-caption text-muted-foreground">
                {s.ownedUnique}
                {s.setTotal != null ? ` / ${s.setTotal}` : ""} cartas
                {s.completionPct != null ? ` · ${s.completionPct}%` : ""}
              </p>
              <p className="mt-2 text-small font-medium text-foreground">
                {s.value > 0 ? formatCurrency(s.value, currency) : "Valor —"}
              </p>
              {s.missing != null && s.missing > 0 && (
                <p className="mt-1 text-caption text-primary">Faltam {s.missing}</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function gameCodeFromSlug(slug: string): string {
  const id = gameIdFromSlug(slug);
  return id ? String(id) : slug.toUpperCase();
}

export function gameNameFromSlug(slug: string): string {
  const id = gameIdFromSlug(slug);
  return id ? GAME_TOKENS[id as GameId].name : slug;
}
