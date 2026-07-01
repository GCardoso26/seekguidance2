"use client";

import { useMemo } from "react";
import { parseSearchSyntax } from "@/lib/marketplace-search-syntax";

export type ParsedSyntax = {
  textQuery: string;
  filters: Array<{ field: string; operator: string; value: string | number }>;
  errors: string[];
};

export function useSearchSyntax(query: string): ParsedSyntax & { isValid: boolean } {
  return useMemo(() => {
    const { textQuery, syntaxFilters } = parseSearchSyntax(query);
    const errors: string[] = [];
    const known = new Set([
      "name", "set", "color", "type", "cmc", "power", "toughness", "artist", "oracle",
      "rarity", "foil", "signed", "graded", "lang", "language",
    ]);
    for (const f of syntaxFilters) {
      if (!known.has(String(f.field))) {
        errors.push(`Campo desconhecido: ${f.field}`);
      }
    }
    return {
      textQuery,
      filters: syntaxFilters.map((f) => ({
        field: String(f.field),
        operator: f.operator,
        value: f.value,
      })),
      errors,
      isValid: errors.length === 0,
    };
  }, [query]);
}
