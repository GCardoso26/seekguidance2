export type SyntaxFilterField =
  | "name"
  | "set"
  | "color"
  | "type"
  | "cmc"
  | "power"
  | "toughness"
  | "artist"
  | "oracle"
  | "rarity"
  | "foil"
  | "signed"
  | "graded"
  | "lang"
  | "language";

export type SyntaxFilterOperator = ":" | "=" | "<" | ">" | "<=" | ">=";

export interface SyntaxFilter {
  field: SyntaxFilterField | string;
  operator: SyntaxFilterOperator;
  value: string | number;
}

const SYNTAX_REGEX = /(\w+)([:=<>]+)("[^"]+"|\S+)/g;

export function parseSearchSyntax(query: string): {
  textQuery: string;
  syntaxFilters: SyntaxFilter[];
} {
  const syntaxFilters: SyntaxFilter[] = [];
  let textQuery = query;

  let match: RegExpExecArray | null;
  const regex = new RegExp(SYNTAX_REGEX.source, "g");
  while ((match = regex.exec(query)) !== null) {
    const [, field, operator, rawValue] = match;
    const value = rawValue.replace(/^"|"$/g, "");
    const numeric = Number(value);
    syntaxFilters.push({
      field,
      operator: operator as SyntaxFilterOperator,
      value: Number.isFinite(numeric) && operator !== ":" ? numeric : value,
    });
    textQuery = textQuery.replace(match[0], "").trim();
  }

  return { textQuery: textQuery.trim(), syntaxFilters };
}

export function syntaxFiltersToSearchParams(filters: SyntaxFilter[]): URLSearchParams {
  const params = new URLSearchParams();
  for (const f of filters) {
    if (f.field === "set") params.set("set", String(f.value));
    if (f.field === "color") params.append("colors", String(f.value));
    if (f.field === "name") params.set("q", String(f.value));
    if (f.field === "cmc" && f.operator === "<=") params.set("cmc_max", String(f.value));
    if (f.field === "cmc" && f.operator === ">=") params.set("cmc_min", String(f.value));
  }
  return params;
}
