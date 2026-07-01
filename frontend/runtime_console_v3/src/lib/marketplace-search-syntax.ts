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

export const KNOWN_VALUES: Record<string, string[]> = {
  color: ["W", "U", "B", "R", "G", "C", "M", "White", "Blue", "Black", "Red", "Green", "Colorless"],
  rarity: ["common", "uncommon", "rare", "mythic", "special", "bonus"],
  foil: ["true", "false", "yes", "no"],
  signed: ["true", "false", "yes", "no"],
  graded: ["true", "false", "yes", "no"],
  grading_company: ["PSA", "BGS", "CGC", "SGC", "ACE"],
};

export const FIELD_COLORS: Record<string, string> = {
  name: "bg-blue-500/15 text-blue-400",
  set: "bg-purple-500/15 text-purple-400",
  color: "bg-red-500/15 text-red-400",
  rarity: "bg-yellow-500/15 text-yellow-400",
  cmc: "bg-green-500/15 text-green-400",
  type: "bg-indigo-500/15 text-indigo-400",
  artist: "bg-pink-500/15 text-pink-400",
  foil: "bg-amber-500/15 text-amber-400",
  graded: "bg-emerald-500/15 text-emerald-400",
};

const VALUE_AUTOCOMPLETE_FIELDS = new Set(["set", "color", "colors", "artist", "rarity", "type", "types"]);

export function isKnownValue(field: string, value: string): boolean {
  const known = KNOWN_VALUES[field.toLowerCase()];
  if (!known) return true;
  return known.some((k) => k.toLowerCase() === value.toLowerCase());
}

export function suggestValue(field: string, value: string): string | null {
  const known = KNOWN_VALUES[field.toLowerCase()];
  if (!known) return null;
  const match = known.find((k) => k.toLowerCase().startsWith(value.toLowerCase()));
  return match ?? null;
}

export function supportsValueAutocomplete(field: string): boolean {
  return VALUE_AUTOCOMPLETE_FIELDS.has(field.toLowerCase());
}

export function parseActiveSyntaxContext(beforeCursor: string): {
  mode: "field" | "value" | "none";
  field: string | null;
  valueQuery: string;
} {
  const valueMatch = beforeCursor.match(/([a-zA-Z_]+)\s*:\s*("([^"]*)"?)?([^:\s"]*)$/);
  if (valueMatch) {
    const field = valueMatch[1].toLowerCase();
    const quoted = valueMatch[3];
    const partial = quoted ?? valueMatch[4] ?? "";
    if (supportsValueAutocomplete(field)) {
      return { mode: "value", field, valueQuery: partial };
    }
  }
  const fieldMatch = beforeCursor.match(/([a-zA-Z_]+)$/);
  if (fieldMatch && !beforeCursor.endsWith(":")) {
    return { mode: "field", field: fieldMatch[1].toLowerCase(), valueQuery: "" };
  }
  return { mode: "none", field: null, valueQuery: "" };
}
