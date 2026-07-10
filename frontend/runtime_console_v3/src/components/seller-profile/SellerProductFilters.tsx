"use client";

import { useState } from "react";
import type { SellerProductFilters } from "@/lib/seller-profile-query";
import { MARKETPLACE_CONDITIONS } from "@/lib/marketplace-filters";
import { ProductFilterSection } from "@/components/marketplace/ProductFilterSection";

type Props = {
  onChange: (filters: SellerProductFilters) => void;
};

export function SellerProductFilters({ onChange }: Props) {
  const [filters, setFilters] = useState<SellerProductFilters>({});

  function update(partial: Partial<SellerProductFilters>) {
    const next = { ...filters, ...partial };
    setFilters(next);
    onChange(next);
  }

  return (
    <aside className="space-y-3 lg:sticky lg:top-24" aria-label="Filtros do vendedor">
      <ProductFilterSection title="Condição" defaultOpen>
        <div className="space-y-1">
          {MARKETPLACE_CONDITIONS.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="seller-condition"
                checked={filters.condition === c.label}
                onChange={() => update({ condition: c.label })}
              />
              {c.label}
            </label>
          ))}
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => update({ condition: undefined })}
          >
            Qualquer
          </button>
        </div>
      </ProductFilterSection>

      <ProductFilterSection title="Atributos">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.foil ?? false}
            onChange={(e) => update({ foil: e.target.checked || undefined })}
          />
          Foil
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.graded ?? false}
            onChange={(e) => update({ graded: e.target.checked || undefined })}
          />
          Graduada
        </label>
      </ProductFilterSection>

      <ProductFilterSection title="Preço (R$)">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            className="w-full rounded border border-border bg-muted/50 px-2 py-1 text-sm"
            onChange={(e) =>
              update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <input
            type="number"
            placeholder="Máx"
            className="w-full rounded border border-border bg-muted/50 px-2 py-1 text-sm"
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </ProductFilterSection>
    </aside>
  );
}
