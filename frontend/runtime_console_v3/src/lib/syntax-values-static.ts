import { getGameConfig } from "@/lib/game-config";
import { getRaritySyntaxValues } from "@/lib/game-config/rarity";

export type SyntaxValueOption = {
  value: string;
  count: number;
  highlight?: string | null;
};

export type SyntaxValuesResponse = {
  field: string;
  game: string;
  query: string;
  values: SyntaxValueOption[];
  total: number;
};

const COLOR_LABELS: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
  M: "Multicolor",
};

function highlightText(value: string, query: string): string | null {
  if (!query) return null;
  const idx = value.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return null;
  const before = value.slice(0, idx);
  const match = value.slice(idx, idx + query.length);
  const after = value.slice(idx + query.length);
  return `${before}<b>${match}</b>${after}`;
}

function staticPoolForField(game: string, fieldKey: string): string[] {
  const cfg = getGameConfig(game);
  if (!cfg) return [];

  if (fieldKey === "rarity") return getRaritySyntaxValues(game);
  if (fieldKey === "color" || fieldKey === "colors") {
    return (cfg.colors ?? []).map((c) => c.value);
  }
  if (fieldKey === "type" || fieldKey === "types") {
    return cfg.types ?? [];
  }
  return [];
}

export function getStaticSyntaxValues(
  field: string,
  game: string,
  q: string,
  limit: number,
): SyntaxValuesResponse {
  const gameKey = game.toLowerCase();
  const fieldKey = field.toLowerCase();
  const pool = staticPoolForField(gameKey, fieldKey);
  const query = q.trim().toLowerCase();

  let filtered = pool;
  if (query) {
    filtered = pool.filter((v) => v.toLowerCase().includes(query));
  }

  const values: SyntaxValueOption[] = filtered.slice(0, limit).map((value) => {
    const label =
      fieldKey === "color" && COLOR_LABELS[value] ? `${value} (${COLOR_LABELS[value]})` : value;
    return {
      value,
      count: 0,
      highlight:
        highlightText(label, q) ??
        (fieldKey === "color" && COLOR_LABELS[value] ? label : undefined),
    };
  });

  return {
    field: fieldKey,
    game: gameKey,
    query: q,
    values,
    total: values.length,
  };
}
