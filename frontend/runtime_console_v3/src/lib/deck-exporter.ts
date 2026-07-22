import type { Deck, DeckCardEntry } from "@/types/deck";

export function exportToText(cards: DeckCardEntry[]): string {
  return cards.map((c) => `${c.quantity} ${c.card.name}`).join("\n");
}

export function exportToMTGO(main: DeckCardEntry[], sideboard: DeckCardEntry[]): string {
  const mainText = exportToText(main);
  const sbText = sideboard.map((c) => `SB: ${c.quantity} ${c.card.name}`).join("\n");
  return [mainText, sbText].filter(Boolean).join("\n\n");
}

export function exportDeckFull(
  deck: Deck,
  format: "text" | "mtgo" | "json" | "csv" | "judgetcg" = "text",
): string {
  if (format === "mtgo") {
    return exportToMTGO(deck.main_deck, deck.sideboard);
  }
  if (format === "csv") {
    const rows = ["zone,quantity,name,card_id"];
    const push = (zone: string, entries: DeckCardEntry[]) => {
      for (const e of entries) {
        rows.push(
          `${zone},${e.quantity},"${(e.card.name || "").replace(/"/g, '""')}",${e.card_id}`,
        );
      }
    };
    push("main", deck.main_deck);
    push("sideboard", deck.sideboard);
    push("commander", deck.commander);
    return rows.join("\n");
  }
  if (format === "json" || format === "judgetcg") {
    return JSON.stringify(
      {
        name: deck.name,
        game: deck.game,
        format: deck.format,
        main: deck.main_deck.map((e) => ({
          name: e.card.name,
          quantity: e.quantity,
          card_id: e.card_id,
        })),
        sideboard: deck.sideboard.map((e) => ({
          name: e.card.name,
          quantity: e.quantity,
          card_id: e.card_id,
        })),
        commander: deck.commander.map((e) => ({
          name: e.card.name,
          quantity: e.quantity,
          card_id: e.card_id,
        })),
      },
      null,
      2,
    );
  }
  const sections: string[] = [];
  if (deck.commander.length > 0) {
    sections.push(`// Commander\n${exportToText(deck.commander)}`);
  }
  sections.push(exportToText(deck.main_deck));
  if (deck.sideboard.length > 0) {
    sections.push(`// Sideboard\n${exportToText(deck.sideboard)}`);
  }
  return sections.filter(Boolean).join("\n\n");
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
