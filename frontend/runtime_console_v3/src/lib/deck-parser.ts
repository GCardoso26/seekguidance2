import type { UnifiedCard } from "@/types/card";
import type { DeckFormatRules } from "@/lib/deck-validation";

export interface ParsedCard {
  quantity: number;
  name: string;
  isSideboard: boolean;
  found?: UnifiedCard;
  error?: string;
}

export function parseDeckList(input: string): ParsedCard[] {
  const lines = input.split("\n").filter((l) => l.trim());
  const parsed: ParsedCard[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    const match = line.match(/^(?:SB:\s*)?(\d+)\s+(.+)$/i);
    if (!match) {
      parsed.push({ quantity: 0, name: line, isSideboard: false, error: "Formato inválido" });
      continue;
    }

    parsed.push({
      quantity: parseInt(match[1], 10),
      name: match[2].trim(),
      isSideboard: /^sb:/i.test(line),
    });
  }

  return parsed;
}

async function searchCardByName(name: string, game: string): Promise<UnifiedCard | null> {
  const params = new URLSearchParams({ q: name, game, limit: "5" });
  const res = await fetch(`/api/catalog/cards/search?${params.toString()}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { cards?: UnifiedCard[] };
  const cards = data.cards ?? [];
  if (cards.length === 0) return null;

  const normalized = name.trim().toLowerCase();
  const exact = cards.find((c) => c.name.trim().toLowerCase() === normalized);
  return exact ?? cards[0];
}

export async function resolveCards(
  parsed: ParsedCard[],
  gameId: string,
  formatRules: DeckFormatRules,
): Promise<ParsedCard[]> {
  const maxCopies =
    typeof formatRules.max_copies === "number"
      ? formatRules.max_copies
      : formatRules.singleton
        ? 1
        : 4;

  const nameTotals = new Map<string, number>();
  const resolved: ParsedCard[] = [];

  for (const entry of parsed) {
    if (entry.error) {
      resolved.push(entry);
      continue;
    }

    const found = await searchCardByName(entry.name, gameId);
    const key = entry.name.trim().toLowerCase();
    const nextTotal = (nameTotals.get(key) ?? 0) + entry.quantity;
    nameTotals.set(key, nextTotal);

    if (!found) {
      resolved.push({ ...entry, error: "Não encontrado" });
      continue;
    }

    if (entry.quantity > maxCopies) {
      resolved.push({ ...entry, found, error: `Máximo ${maxCopies} cópias por carta` });
      continue;
    }

    if (nextTotal > maxCopies) {
      resolved.push({ ...entry, found, error: `Total excede ${maxCopies} cópias` });
      continue;
    }

    resolved.push({ ...entry, found });
  }

  return resolved;
}
