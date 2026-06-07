import type { DeckCard, ParsedDecklist } from "@/lib/tcg-adapters/types";

const LINE_RE = /^(\d+)\s+(.+?)(?:\s+\(([A-Z0-9]+)\)\s*(\d+))?$/i;

function cardFromLine(qty: number, name: string, setCode?: string, num?: string, cardType?: string): DeckCard {
  const norm = name.trim().toLowerCase().replace(/\s+/g, " ");
  return {
    definition_id: norm.replace(/\s+/g, "-"),
    name: name.trim(),
    quantity: qty,
    set_code: setCode,
    collector_number: num,
    card_type: cardType,
  };
}

export function parseGenericDecklist(raw: string, tcg: string, format: string): ParsedDecklist {
  const main: DeckCard[] = [];
  const sideboard: DeckCard[] = [];
  let section: "main" | "sideboard" = "main";
  let commander: DeckCard | undefined;

  for (const line of raw.split("\n")) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("//") || stripped.startsWith("#")) continue;
    const lower = stripped.toLowerCase();
    if (lower === "sideboard" || lower.startsWith("sb:")) {
      section = "sideboard";
      continue;
    }
    if (lower.startsWith("commander:")) {
      const rest = stripped.split(":").slice(1).join(":").trim();
      const m = rest.match(/^(\d+)\s+(.+)$/);
      if (m) commander = cardFromLine(Number(m[1]), m[2]);
      continue;
    }
    if (lower.startsWith("deck") || lower.startsWith("maindeck")) {
      section = "main";
      continue;
    }

    const m = stripped.match(LINE_RE);
    if (!m) continue;
    const c = cardFromLine(Number(m[1]), m[2], m[3], m[4]);
    if (section === "sideboard") sideboard.push(c);
    else main.push(c);
  }

  return { tcg, format, main_deck: main, sideboard, commander };
}

export function parsePokemonDecklist(raw: string, format: string): ParsedDecklist {
  if (raw.trim().startsWith("{")) {
    const data = JSON.parse(raw) as { main_deck?: DeckCard[]; cards?: DeckCard[] };
    return { tcg: "pokemon", format, main_deck: data.main_deck ?? data.cards ?? [] };
  }

  const main: DeckCard[] = [];
  let cardType: string | undefined;
  for (const line of raw.split("\n")) {
    const stripped = line.trim();
    if (!stripped) continue;
    if (/^(pokémon|pokemon|trainer|treinador|energy|energia)\s*:\s*\d*\s*$/i.test(stripped)) {
      const h = stripped.split(":")[0].toLowerCase();
      if (h.includes("pokémon") || h.includes("pokemon")) cardType = "pokemon";
      else if (h.includes("trainer") || h.includes("treinador")) cardType = "trainer";
      else if (h.includes("energy") || h.includes("energia")) cardType = "energy";
      continue;
    }
    const m = stripped.match(LINE_RE);
    if (m) main.push(cardFromLine(Number(m[1]), m[2], undefined, undefined, cardType));
  }
  return { tcg: "pokemon", format, main_deck: main };
}
