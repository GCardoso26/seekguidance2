import type { Deck, DeckCardEntry } from "@/types/deck";
import type { UnifiedCard } from "@/types/card";

export type ManaCurveBucket = { cmc: number; count: number };

export type DeckCatalogStats = {
  totalCards: number;
  mainCards: number;
  sideboardCards: number;
  commanderCards: number;
  uniqueCards: number;
  lands: number;
  creatures: number;
  spells: number;
  artifacts: number;
  enchantments: number;
  planeswalkers: number;
  other: number;
  premium: number;
  foil: number;
  manaCurve: ManaCurveBucket[];
  byColor: Record<string, number>;
  byType: Record<string, number>;
  byFaction: Record<string, number>;
  estimatedPrice: number;
  minPrice: number | null;
  avgPrice: number | null;
  bannedHints: number;
  restrictedHints: number;
  illegalHints: number;
};

function allEntries(deck: Deck): DeckCardEntry[] {
  return [
    ...(deck.main_deck ?? []),
    ...(deck.sideboard ?? []),
    ...(deck.commander ?? []),
    ...(deck.companion ?? []),
  ];
}

function cardCmc(card: UnifiedCard): number {
  if (typeof card.cmc === "number" && Number.isFinite(card.cmc)) return Math.min(7, Math.floor(card.cmc));
  const gd = card.gameData || {};
  const raw = gd.cmc ?? gd.manaValue ?? gd.ink_cost ?? gd.cost;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n)) return Math.min(7, Math.max(0, Math.floor(n)));
  return 0;
}

function typeLine(card: UnifiedCard): string {
  return (
    card.typeLine ||
    [...(card.types ?? []), ...(card.subtypes ?? [])].join(" ") ||
    String(card.gameData?.type_line ?? card.gameData?.type ?? "")
  ).toLowerCase();
}

function isLand(card: UnifiedCard): boolean {
  return /land|terrain|localidade|local/.test(typeLine(card));
}

function isCreature(card: UnifiedCard): boolean {
  return /creature|criatura|character|personagem|unit/.test(typeLine(card));
}

function colorsOf(card: UnifiedCard): string[] {
  const c = card.colors;
  if (Array.isArray(c)) return c.map(String);
  if (typeof c === "string" && c) return c.split("").filter(Boolean);
  const gd = card.gameData;
  if (Array.isArray(gd?.colors)) return gd.colors.map(String);
  if (typeof gd?.color_identity === "string") return gd.color_identity.split("");
  if (Array.isArray(gd?.color_identity)) return gd.color_identity.map(String);
  if (typeof gd?.ink === "string") return [gd.ink];
  if (Array.isArray(gd?.inks)) return gd.inks.map(String);
  return ["C"];
}

function factionsOf(card: UnifiedCard): string[] {
  const gd = card.gameData || {};
  const f = gd.faction ?? gd.factions ?? gd.clan ?? gd.affiliation;
  if (Array.isArray(f)) return f.map(String);
  if (typeof f === "string" && f) return [f];
  return [];
}

function isPremium(card: UnifiedCard): boolean {
  const r = String(card.rarity || "").toLowerCase();
  return /mythic|legendary|secret|ultra|special|enchanted|promo|rare/.test(r);
}

function legalityStatus(card: UnifiedCard, format: string): string | null {
  if (!card.legalities) return null;
  const key = Object.keys(card.legalities).find((k) => k.toLowerCase() === format.toLowerCase());
  if (!key) return null;
  return card.legalities[key];
}

/**
 * Estatísticas derivadas dos campos Catalog já embutidos nas cartas do deck.
 * Não chama Pricing — preços usam lowestPrice do Catalog quando presente.
 */
export function computeDeckCatalogStats(deck: Deck): DeckCatalogStats {
  const entries = allEntries(deck);
  const main = deck.main_deck ?? [];
  const side = deck.sideboard ?? [];
  const commanders = deck.commander ?? [];

  const manaMap = new Map<number, number>();
  const byColor: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byFaction: Record<string, number> = {};

  let lands = 0;
  let creatures = 0;
  let spells = 0;
  let artifacts = 0;
  let enchantments = 0;
  let planeswalkers = 0;
  let other = 0;
  let premium = 0;
  let foil = 0;
  let totalCards = 0;
  let priceSum = 0;
  let priceCount = 0;
  let minPrice: number | null = null;
  let bannedHints = 0;
  let restrictedHints = 0;
  let illegalHints = 0;

  for (const entry of entries) {
    const qty = entry.quantity;
    totalCards += qty;
    if (entry.is_foil) foil += qty;
    const card = entry.card;
    if (isPremium(card)) premium += qty;

    const cmc = cardCmc(card);
    manaMap.set(cmc, (manaMap.get(cmc) ?? 0) + qty);

    for (const col of colorsOf(card)) {
      byColor[col] = (byColor[col] ?? 0) + qty;
    }
    for (const fac of factionsOf(card)) {
      byFaction[fac] = (byFaction[fac] ?? 0) + qty;
    }

    const tl = typeLine(card);
    if (isLand(card)) {
      lands += qty;
      byType.Land = (byType.Land ?? 0) + qty;
    } else if (isCreature(card)) {
      creatures += qty;
      byType.Creature = (byType.Creature ?? 0) + qty;
    } else if (/artifact|artefato/.test(tl)) {
      artifacts += qty;
      byType.Artifact = (byType.Artifact ?? 0) + qty;
    } else if (/enchantment|encantamento/.test(tl)) {
      enchantments += qty;
      byType.Enchantment = (byType.Enchantment ?? 0) + qty;
    } else if (/planeswalker/.test(tl)) {
      planeswalkers += qty;
      byType.Planeswalker = (byType.Planeswalker ?? 0) + qty;
    } else {
      spells += qty;
      other += qty;
      byType.Spell = (byType.Spell ?? 0) + qty;
    }

    const p = card.lowestPrice ?? card.latestPrice?.price;
    if (typeof p === "number" && Number.isFinite(p)) {
      priceSum += p * qty;
      priceCount += qty;
      minPrice = minPrice == null ? p : Math.min(minPrice, p);
    }

    const status = legalityStatus(card, deck.format);
    if (status === "banned") bannedHints += qty;
    else if (status === "restricted") restrictedHints += qty;
    else if (status === "not_legal") illegalHints += qty;
  }

  const manaCurve: ManaCurveBucket[] = [];
  for (let i = 0; i <= 7; i++) {
    manaCurve.push({ cmc: i, count: manaMap.get(i) ?? 0 });
  }

  return {
    totalCards,
    mainCards: main.reduce((s, e) => s + e.quantity, 0),
    sideboardCards: side.reduce((s, e) => s + e.quantity, 0),
    commanderCards: commanders.reduce((s, e) => s + e.quantity, 0),
    uniqueCards: entries.length,
    lands,
    creatures,
    spells,
    artifacts,
    enchantments,
    planeswalkers,
    other,
    premium,
    foil,
    manaCurve,
    byColor,
    byType,
    byFaction,
    estimatedPrice: priceSum,
    minPrice,
    avgPrice: priceCount > 0 ? priceSum / priceCount : null,
    bannedHints,
    restrictedHints,
    illegalHints,
  };
}

export type DeckRevisionSnapshot = {
  name: string;
  format: string;
  game: string;
  main: Array<{ card_id: string; name: string; quantity: number }>;
  sideboard: Array<{ card_id: string; name: string; quantity: number }>;
  commander: Array<{ card_id: string; name: string; quantity: number }>;
  totalCards: number;
  estimatedPrice: number;
};

export function snapshotDeck(deck: Deck): DeckRevisionSnapshot {
  const map = (entries: DeckCardEntry[]) =>
    entries.map((e) => ({
      card_id: e.card_id,
      name: e.card?.name ?? e.card_id,
      quantity: e.quantity,
    }));
  const stats = computeDeckCatalogStats(deck);
  return {
    name: deck.name,
    format: deck.format,
    game: deck.game,
    main: map(deck.main_deck ?? []),
    sideboard: map(deck.sideboard ?? []),
    commander: map(deck.commander ?? []),
    totalCards: stats.totalCards,
    estimatedPrice: stats.estimatedPrice,
  };
}

export type DeckRevisionDiff = {
  added: Array<{ card_id: string; name: string; quantity: number; zone: string }>;
  removed: Array<{ card_id: string; name: string; quantity: number; zone: string }>;
  changed: Array<{
    card_id: string;
    name: string;
    from: number;
    to: number;
    zone: string;
  }>;
  priceDelta: number;
  cardCountDelta: number;
};

function zoneMap(
  entries: Array<{ card_id: string; name: string; quantity: number }>,
  zone: string,
) {
  const m = new Map<string, { card_id: string; name: string; quantity: number; zone: string }>();
  for (const e of entries) {
    const key = `${zone}:${e.card_id}`;
    m.set(key, { ...e, zone });
  }
  return m;
}

export function diffSnapshots(
  a: DeckRevisionSnapshot,
  b: DeckRevisionSnapshot,
): DeckRevisionDiff {
  const zones: Array<[keyof Pick<DeckRevisionSnapshot, "main" | "sideboard" | "commander">, string]> =
    [
      ["main", "main"],
      ["sideboard", "sideboard"],
      ["commander", "commander"],
    ];
  const added: DeckRevisionDiff["added"] = [];
  const removed: DeckRevisionDiff["removed"] = [];
  const changed: DeckRevisionDiff["changed"] = [];

  for (const [key, zone] of zones) {
    const before = zoneMap(a[key], zone);
    const after = zoneMap(b[key], zone);
    const ids = new Set([...before.keys(), ...after.keys()]);
    for (const id of ids) {
      const x = before.get(id);
      const y = after.get(id);
      if (!x && y) added.push(y);
      else if (x && !y) removed.push(x);
      else if (x && y && x.quantity !== y.quantity) {
        changed.push({
          card_id: y.card_id,
          name: y.name,
          from: x.quantity,
          to: y.quantity,
          zone,
        });
      }
    }
  }

  return {
    added,
    removed,
    changed,
    priceDelta: b.estimatedPrice - a.estimatedPrice,
    cardCountDelta: b.totalCards - a.totalCards,
  };
}
