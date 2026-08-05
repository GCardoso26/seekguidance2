"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import {
  buildSearchEmptyState,
  type PurchaseIntent,
} from "@/features/search/conversion";

type Props = {
  query: string;
  intent: PurchaseIntent;
  onClearFilters?: () => void;
};

/** Empty state buy-first — nunca página em branco. */
export function SearchBuyEmptyState({ query, intent, onClearFilters }: Props) {
  const model = buildSearchEmptyState(query, intent);

  return (
    <div className="space-y-6" data-testid="search-buy-empty">
      <EmptyState
        icon={<ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden />}
        title={model.title}
        description={model.description}
        action={
          onClearFilters
            ? undefined
            : { label: "Ver singles", href: "/loja/singles" }
        }
      />
      {onClearFilters && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <h3 className="text-sm font-semibold text-foreground">Continue explorando</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {model.suggestions.map((s) => (
            <li key={s.href + s.label}>
              <Link
                href={s.href}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
