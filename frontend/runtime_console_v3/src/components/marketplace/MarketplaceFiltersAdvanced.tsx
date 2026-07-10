"use client";

import type { MarketplaceProductFilters } from "@/lib/marketplace-filters";
import { ProductFilterSection } from "@/components/marketplace/ProductFilterSection";
import { SearchSyntaxHelp } from "@/components/marketplace/SearchSyntaxHelp";

type Props = {
  filters: MarketplaceProductFilters;
  onChange: (updates: Partial<MarketplaceProductFilters>) => void;
};

export function MarketplaceFiltersAdvanced({ filters, onChange }: Props) {
  return (
    <div className="space-y-3">
      <ProductFilterSection title="Busca avançada" defaultOpen>
        <div className="relative">
          <input
            type="text"
            value={filters.syntaxQuery ?? ""}
            onChange={(e) => onChange({ syntaxQuery: e.target.value || undefined, page: 1 })}
            placeholder='name:"Sol Ring" set:cmd'
            className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
            aria-label="Busca com sintaxe"
          />
          <SearchSyntaxHelp />
        </div>
      </ProductFilterSection>

      <ProductFilterSection title="Tipo de vendedor">
        <div className="space-y-2">
          {(
            [
              { value: "all", label: "Todos" },
              { value: "professional", label: "Lojistas Pro" },
              { value: "normal", label: "Vendedores" },
            ] as const
          ).map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="seller_type"
                checked={(filters.sellerType ?? "all") === value}
                onChange={() => onChange({ sellerType: value, page: 1 })}
              />
              {label}
            </label>
          ))}
        </div>
      </ProductFilterSection>

      <ProductFilterSection title="Graduação">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.graded ?? false}
            onChange={(e) => onChange({ graded: e.target.checked || undefined, page: 1 })}
          />
          Apenas graduadas
        </label>
        {filters.graded && (
          <div className="mt-3 space-y-3 pl-1">
            <select
              value={filters.gradingCompany ?? "any"}
              onChange={(e) =>
                onChange({
                  gradingCompany: e.target.value === "any" ? undefined : e.target.value,
                  page: 1,
                })
              }
              className="w-full rounded border border-border bg-muted/50 px-2 py-1 text-sm"
            >
              <option value="any">Qualquer empresa</option>
              <option value="PSA">PSA</option>
              <option value="BGS">BGS</option>
              <option value="CGC">CGC</option>
            </select>
            <div>
              <label className="text-xs text-muted-foreground">Nota mínima</label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={filters.gradingMinScore ?? 8}
                onChange={(e) =>
                  onChange({ gradingMinScore: parseFloat(e.target.value), page: 1 })
                }
                className="w-full"
              />
              <p className="text-center text-sm font-medium">{(filters.gradingMinScore ?? 8).toFixed(1)}+</p>
            </div>
          </div>
        )}
      </ProductFilterSection>
    </div>
  );
}
