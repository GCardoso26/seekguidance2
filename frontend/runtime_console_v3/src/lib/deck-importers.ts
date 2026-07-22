import { parseDeckList, type ParsedCard } from "@/lib/deck-parser";

/**
 * Pipeline: Importer → Normalizer → Catalog IDs (via resolveCards) → Deck
 * Parsers vivem aqui — UI só escolhe o formato e cola o texto.
 */

export type DeckImportFormat =
  | "txt"
  | "arena"
  | "mtgo"
  | "moxfield"
  | "archidekt"
  | "dreamborn"
  | "limitless"
  | "ligamagic"
  | "json"
  | "judgetcg";

export type DeckImporter = {
  id: DeckImportFormat;
  label: string;
  description: string;
  parse: (raw: string) => ParsedCard[];
};

function stripSectionHeaders(raw: string): string {
  return raw
    .replace(/^(Deck|Decklist|Sideboard|About|Commander|Companion)\s*$/gim, (m) =>
      /sideboard/i.test(m) ? "SB: 0 PLACEHOLDER" : "",
    )
    .replace(/^SB:\s*0\s+PLACEHOLDER\s*$/gim, "SB:");
}

/** Arena: "1 Card Name (SET) 123" ou "1 Card Name" */
function parseArena(raw: string): ParsedCard[] {
  const lines = raw.split("\n");
  const out: ParsedCard[] = [];
  let side = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;
    if (/^sideboard$/i.test(line)) {
      side = true;
      continue;
    }
    if (/^deck$/i.test(line)) {
      side = false;
      continue;
    }
    const m = line.match(/^(\d+)\s+(.+?)(?:\s+\([A-Z0-9]+\)\s+\d+)?$/i);
    if (!m) {
      out.push({ quantity: 0, name: line, isSideboard: side, error: "Formato Arena inválido" });
      continue;
    }
    out.push({ quantity: Number(m[1]), name: m[2].trim(), isSideboard: side });
  }
  return out;
}

function parseMtgo(raw: string): ParsedCard[] {
  return parseDeckList(raw.replace(/^Sideboard:?$/gim, "SB:"));
}

function parseMoxfieldLike(raw: string): ParsedCard[] {
  // Moxfield/Archidekt exportam texto compatível com N Name + SB:
  return parseDeckList(stripSectionHeaders(raw));
}

function parseJsonJudge(raw: string): ParsedCard[] {
  try {
    const data = JSON.parse(raw) as {
      main?: Array<{ name: string; quantity: number }>;
      sideboard?: Array<{ name: string; quantity: number }>;
      cards?: Array<{ name: string; quantity: number; sideboard?: boolean }>;
    };
    const out: ParsedCard[] = [];
    for (const c of data.main ?? []) {
      out.push({ quantity: c.quantity, name: c.name, isSideboard: false });
    }
    for (const c of data.sideboard ?? []) {
      out.push({ quantity: c.quantity, name: c.name, isSideboard: true });
    }
    for (const c of data.cards ?? []) {
      out.push({
        quantity: c.quantity,
        name: c.name,
        isSideboard: Boolean(c.sideboard),
      });
    }
    return out;
  } catch {
    return [{ quantity: 0, name: "JSON", isSideboard: false, error: "JSON inválido" }];
  }
}

export const DECK_IMPORTERS: DeckImporter[] = [
  {
    id: "txt",
    label: "TXT / Genérico",
    description: "N Nome · SB: N Nome",
    parse: parseDeckList,
  },
  {
    id: "arena",
    label: "MTG Arena",
    description: "Export Arena com seções Deck/Sideboard",
    parse: parseArena,
  },
  {
    id: "mtgo",
    label: "MTGO",
    description: "Magic Online",
    parse: parseMtgo,
  },
  {
    id: "moxfield",
    label: "Moxfield",
    description: "Export texto Moxfield",
    parse: parseMoxfieldLike,
  },
  {
    id: "archidekt",
    label: "Archidekt",
    description: "Export texto Archidekt",
    parse: parseMoxfieldLike,
  },
  {
    id: "dreamborn",
    label: "Dreamborn",
    description: "Lorcana (texto N Nome)",
    parse: parseDeckList,
  },
  {
    id: "limitless",
    label: "Limitless",
    description: "Pokémon / Limitless",
    parse: parseDeckList,
  },
  {
    id: "ligamagic",
    label: "LigaMagic",
    description: "Lista LigaMagic",
    parse: parseDeckList,
  },
  {
    id: "json",
    label: "JSON",
    description: "JSON genérico main/sideboard",
    parse: parseJsonJudge,
  },
  {
    id: "judgetcg",
    label: "JudgeTCG",
    description: "Snapshot JSON JudgeTCG",
    parse: parseJsonJudge,
  },
];

export function getImporter(id: DeckImportFormat): DeckImporter {
  return DECK_IMPORTERS.find((i) => i.id === id) ?? DECK_IMPORTERS[0];
}

export function runImporter(id: DeckImportFormat, raw: string): ParsedCard[] {
  return getImporter(id).parse(raw);
}
