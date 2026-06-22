import type { Deck, DeckCardEntry } from "@/types/deck";

export interface DeckFormatRules {
  min_cards?: number | null;
  max_cards?: number | null;
  singleton?: boolean;
  commander_required?: boolean;
  banlist?: string[];
  max_copies?: number;
  sideboard_max?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function normalizeValidationResult(raw: {
  isValid?: boolean;
  is_valid?: boolean;
  errors?: string[];
  warnings?: string[];
}): ValidationResult {
  return {
    isValid: raw.isValid ?? raw.is_valid ?? false,
    errors: raw.errors ?? [],
    warnings: raw.warnings ?? [],
  };
}

export function formatValidationErrors(errors: string[], warnings: string[] = []): string[] {
  const lines = [...errors];
  for (const warning of warnings) {
    if (warning && !lines.includes(warning)) lines.push(warning);
  }
  return lines;
}

function countDeckCards(cards: DeckCardEntry[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

export function validateDeckCards(deck: Deck, rules: DeckFormatRules): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mainForCopies = [...deck.main_deck, ...deck.commander];
  const allForSingleton = [...deck.main_deck, ...deck.sideboard, ...deck.commander];

  const mainCount = countDeckCards(deck.main_deck);
  if (typeof rules.min_cards === "number" && mainCount < rules.min_cards) {
    errors.push(`Deck precisa de no mínimo ${rules.min_cards} cartas`);
  }
  if (typeof rules.max_cards === "number" && rules.max_cards > 0 && mainCount > rules.max_cards) {
    errors.push(`Deck pode ter no máximo ${rules.max_cards} cartas`);
  }

  if (typeof rules.sideboard_max === "number" && countDeckCards(deck.sideboard) > rules.sideboard_max) {
    errors.push(`Sideboard excede o limite de ${rules.sideboard_max} cartas`);
  }

  const maxCopies = typeof rules.max_copies === "number" ? rules.max_copies : deck.format.toLowerCase() === "commander" ? 1 : 4;
  const byName = new Map<string, number>();
  for (const item of mainForCopies) {
    const key = item.card.name.trim().toLowerCase();
    byName.set(key, (byName.get(key) ?? 0) + item.quantity);
  }
  const overLimit = [...byName.entries()].filter(([, qty]) => qty > maxCopies);
  if (overLimit.length > 0) {
    errors.push(`Há cartas com mais de ${maxCopies} cópias`);
    warnings.push(overLimit.map(([name]) => name).slice(0, 8).join(", "));
  }

  if (rules.singleton) {
    const duplicates = allForSingleton.filter((c) => c.quantity > 1);
    if (duplicates.length > 0) {
      errors.push("Formato singleton: algumas cartas estão duplicadas");
    }
  }

  if (rules.commander_required && countDeckCards(deck.commander) !== 1) {
    errors.push("Formato exige exatamente 1 comandante");
  }

  if (rules.banlist && rules.banlist.length > 0) {
    const banned = new Set(rules.banlist.map((n) => n.trim().toLowerCase()));
    const found = allForSingleton.filter((entry) => banned.has(entry.card.name.trim().toLowerCase()));
    if (found.length > 0) {
      errors.push("Deck contém cartas banidas");
      warnings.push(found.map((c) => c.card.name).slice(0, 8).join(", "));
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}
