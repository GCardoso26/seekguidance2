import { parseGenericDecklist } from "@/lib/tcg-adapters/parse-decklist";
import type { GameAdapter, TournamentFormat } from "@/lib/tcg-adapters/types";

const FORMATS: TournamentFormat[] = [
  { code: "STANDARD", name: "Standard", decklist_required: true, decklist_validation: true, default_timer_minutes: 55, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
  { code: "LIMITED", name: "Limited", decklist_required: false, decklist_validation: false, default_timer_minutes: 55, default_match_type: "BO3", default_swiss_rounds: "auto", default_top_cut: 8 },
];

export const swuAdapter: GameAdapter = {
  code: "SWU",
  name: "Star Wars Unlimited",
  slug: "swu",
  supportedFormats: FORMATS,
  parseDecklist: (raw, format) => parseGenericDecklist(raw, "swu", format),
  getDecklistHint: () => "Exatamente 50 cartas. Máx. 3 cópias por carta.",
  getMaxCopies: () => 3,
  getMinDeckSize: () => 50,
  getMaxDeckSize: () => 50,
  getSideboardRules: () => null,
};
