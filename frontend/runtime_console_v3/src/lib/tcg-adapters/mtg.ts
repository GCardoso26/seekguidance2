import { parseGenericDecklist } from "@/lib/tcg-adapters/parse-decklist";
import type { GameAdapter, TournamentFormat } from "@/lib/tcg-adapters/types";

const FORMATS: TournamentFormat[] = [
  { code: "STANDARD", name: "Standard", decklist_required: true, decklist_validation: true, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "PIONEER", name: "Pioneer", decklist_required: true, decklist_validation: true, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "MODERN", name: "Modern", decklist_required: true, decklist_validation: true, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "DRAFT", name: "Draft", decklist_required: false, decklist_validation: false, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "3", default_top_cut: 4 },
  { code: "SEALED", name: "Sealed", decklist_required: false, decklist_validation: false, default_timer_minutes: 50, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "COMMANDER", name: "Commander", decklist_required: true, decklist_validation: true, default_timer_minutes: 90, default_match_type: "FFA", default_swiss_rounds: "auto", default_top_cut: null },
];

export const mtgAdapter: GameAdapter = {
  code: "MTG",
  name: "Magic: The Gathering",
  slug: "mtg",
  supportedFormats: FORMATS,
  parseDecklist: (raw, format) => parseGenericDecklist(raw, "mtg", format),
  getDecklistHint: (format) => {
    if (format === "COMMANDER") return "100 cartas singleton + 1 Commander (linha Commander:).";
    if (format === "DRAFT" || format === "SEALED") return "Mínimo 40 cartas. Sem sideboard obrigatório.";
    return "Mínimo 60 cartas, máx. 4 cópias (terras básicas ilimitadas), sideboard até 15.";
  },
  getMaxCopies: (format) => (format === "COMMANDER" ? 1 : 4),
  getMinDeckSize: (format) => {
    if (format === "COMMANDER") return 100;
    if (format === "DRAFT" || format === "SEALED") return 40;
    return 60;
  },
  getMaxDeckSize: (format) => (format === "COMMANDER" ? 100 : null),
  getSideboardRules: (format) =>
    format === "COMMANDER" || format === "DRAFT" || format === "SEALED"
      ? null
      : { maxSize: 15, swapRule: "1:1" },
};
